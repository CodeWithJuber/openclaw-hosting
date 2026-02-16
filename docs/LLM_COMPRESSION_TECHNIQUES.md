# LLM Compression Techniques Guide

## Overview

Techniques to reduce model size, memory usage, and inference latency while maintaining performance.

---

## 1. Quantization

### What It Is
Reduce precision of model weights (e.g., FP32 → INT8 → INT4)

### Types

| Method | Bits | Size Reduction | Use Case |
|--------|------|----------------|----------|
| **FP16** | 16 | 2x | Standard inference |
| **INT8** | 8 | 4x | Production deployment |
| **INT4/GPTQ** | 4 | 8x | Edge devices |
| **NF4/QLoRA** | 4 | 8x | Fine-tuning |

### Implementation

```python
# Using transformers + bitsandbytes
from transformers import AutoModelForCausalLM, BitsAndBytesConfig

# 4-bit quantization
quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_quant_type="nf4",  # Normal Float 4
    bnb_4bit_use_double_quant=True
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b",
    quantization_config=quantization_config
)
```

### Impact
- **7B model FP32**: ~28GB → **INT4**: ~3.5GB
- **Speedup**: 2-4x faster inference
- **Quality loss**: Minimal with proper quantization

---

## 2. Pruning

### What It Is
Remove unnecessary weights/connections from the model

### Types

| Type | Description | Impact |
|------|-------------|--------|
| **Magnitude Pruning** | Remove smallest weights | Simple, effective |
| **Structured Pruning** | Remove entire neurons/heads | Hardware-friendly |
| **Unstructured Pruning** | Remove individual weights | Higher compression |

### Implementation

```python
# Magnitude pruning example
import torch

def prune_model(model, pruning_ratio=0.3):
    for name, param in model.named_parameters():
        if 'weight' in name:
            # Get threshold
            threshold = torch.quantile(torch.abs(param), pruning_ratio)
            # Create mask
            mask = torch.abs(param) > threshold
            # Apply mask
            param.data *= mask
    return model
```

### Structured Pruning (Heads)

```python
# Prune attention heads
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("model-name")

# Remove 30% of attention heads
for layer in model.model.layers:
    num_heads = layer.self_attn.num_heads
    heads_to_prune = int(num_heads * 0.3)
    
    # Prune least important heads
    for head in range(heads_to_prune):
        layer.self_attn.prune_heads([head])
```

---

## 3. Knowledge Distillation

### What It Is
Train a smaller "student" model to mimic a larger "teacher" model

### Architecture

```
┌─────────────────┐
│  TEACHER MODEL  │  (Large, accurate)
│   (e.g., GPT-4) │
└────────┬────────┘
         │ soft labels
         │ (probabilities)
         ▼
┌─────────────────┐
│  STUDENT MODEL  │  (Small, fast)
│  (e.g., 1B param)│
└─────────────────┘
```

### Implementation

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class DistillationLoss(nn.Module):
    def __init__(self, temperature=2.0, alpha=0.5):
        super().__init__()
        self.temperature = temperature
        self.alpha = alpha
        self.ce_loss = nn.CrossEntropyLoss()
    
    def forward(self, student_logits, teacher_logits, labels):
        # Soft targets from teacher
        soft_targets = F.softmax(teacher_logits / self.temperature, dim=-1)
        soft_predictions = F.log_softmax(student_logits / self.temperature, dim=-1)
        
        # Distillation loss
        distillation_loss = F.kl_div(
            soft_predictions, 
            soft_targets, 
            reduction='batchmean'
        ) * (self.temperature ** 2)
        
        # Hard target loss
        hard_loss = self.ce_loss(student_logits, labels)
        
        # Combined loss
        return self.alpha * distillation_loss + (1 - self.alpha) * hard_loss

# Training loop
def distill(teacher, student, dataloader, epochs=3):
    optimizer = torch.optim.AdamW(student.parameters(), lr=5e-5)
    criterion = DistillationLoss(temperature=2.0, alpha=0.5)
    
    for epoch in range(epochs):
        for batch in dataloader:
            # Teacher forward (no grad)
            with torch.no_grad():
                teacher_logits = teacher(**batch).logits
            
            # Student forward
            student_logits = student(**batch).logits
            
            # Compute loss
            loss = criterion(student_logits, teacher_logits, batch['labels'])
            
            # Backprop
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()
```

### Results
- **Distilled GPT-2**: 40% smaller, 97% of teacher performance
- **TinyBERT**: 7.5x smaller than BERT, 96% performance

---

## 4. KV Cache Optimization

### What It Is
Optimize the key-value cache used in attention mechanism during generation

### Problem
- KV cache grows with sequence length
- Memory bottleneck for long contexts

### Solutions

#### 4.1 KV Cache Quantization
```python
# Quantize KV cache to INT8
class QuantizedKVCache:
    def __init__(self, quantize_bits=8):
        self.quantize_bits = quantize_bits
        self.scale = None
        self.zero_point = None
    
    def quantize(self, tensor):
        # Find min/max
        min_val = tensor.min()
        max_val = tensor.max()
        
        # Compute scale and zero point
        qmin = -(2 ** (self.quantize_bits - 1))
        qmax = 2 ** (self.quantize_bits - 1) - 1
        self.scale = (max_val - min_val) / (qmax - qmin)
        self.zero_point = qmin - min_val / self.scale
        
        # Quantize
        quantized = torch.round(tensor / self.scale + self.zero_point)
        return quantized.clamp(qmin, qmax).to(torch.int8)
    
    def dequantize(self, quantized):
        return (quantized.float() - self.zero_point) * self.scale
```

#### 4.2 Sliding Window Attention
```python
# Only keep recent KV pairs
class SlidingWindowKVCache:
    def __init__(self, window_size=4096):
        self.window_size = window_size
        self.cache = {}
    
    def update(self, key, value, layer_idx):
        if layer_idx not in self.cache:
            self.cache[layer_idx] = {'key': key, 'value': value}
        else:
            # Concatenate and truncate to window size
            k = torch.cat([self.cache[layer_idx]['key'], key], dim=-2)
            v = torch.cat([self.cache[layer_idx]['value'], value], dim=-2)
            
            if k.size(-2) > self.window_size:
                k = k[..., -self.window_size:, :]
                v = v[..., -self.window_size:, :]
            
            self.cache[layer_idx] = {'key': k, 'value': v}
        
        return self.cache[layer_idx]['key'], self.cache[layer_idx]['value']
```

#### 4.3 Multi-Query Attention (MQA)
```python
# Share KV across heads (reduces cache by num_heads)
class MultiQueryAttention(nn.Module):
    def __init__(self, embed_dim, num_heads):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        
        # Query per head, single KV
        self.q_proj = nn.Linear(embed_dim, embed_dim)
        self.k_proj = nn.Linear(embed_dim, self.head_dim)  # Single KV
        self.v_proj = nn.Linear(embed_dim, self.head_dim)
        self.o_proj = nn.Linear(embed_dim, embed_dim)
    
    def forward(self, x, past_kv=None):
        B, T, C = x.shape
        
        Q = self.q_proj(x).view(B, T, self.num_heads, self.head_dim).transpose(1, 2)
        K = self.k_proj(x).unsqueeze(1)  # (B, 1, T, head_dim)
        V = self.v_proj(x).unsqueeze(1)  # (B, 1, T, head_dim)
        
        # Expand KV to all heads
        K = K.expand(B, self.num_heads, T, self.head_dim)
        V = V.expand(B, self.num_heads, T, self.head_dim)
        
        # Attention
        attn = torch.softmax(Q @ K.transpose(-2, -1) / (self.head_dim ** 0.5), dim=-1)
        out = attn @ V
        
        return self.o_proj(out.transpose(1, 2).reshape(B, T, C))
```

---

## 5. Speculative Decoding

### What It Is
Use small draft model to predict multiple tokens, verify with large model

### How It Works
```
Draft Model (small, fast) → predicts 4 tokens
         ↓
Target Model (large, accurate) → verifies all 4 at once
         ↓
Accept valid tokens, resample if needed
```

### Implementation

```python
class SpeculativeDecoder:
    def __init__(self, draft_model, target_model, gamma=4):
        self.draft_model = draft_model  # Small, fast
        self.target_model = target_model  # Large, accurate
        self.gamma = gamma  # Number of draft tokens
    
    def generate(self, input_ids, max_new_tokens=100):
        accepted = 0
        
        while accepted < max_new_tokens:
            # 1. Draft model generates gamma tokens
            draft_tokens = []
            current = input_ids
            
            for _ in range(self.gamma):
                logits = self.draft_model(current).logits[:, -1, :]
                token = torch.multinomial(torch.softmax(logits, dim=-1), 1)
                draft_tokens.append(token)
                current = torch.cat([current, token], dim=-1)
            
            # 2. Target model verifies all draft tokens at once
            target_logits = self.target_model(current).logits
            
            # 3. Accept/reject tokens
            for i, draft_token in enumerate(draft_tokens):
                draft_prob = torch.softmax(
                    self.draft_model(input_ids).logits[:, -1, :], dim=-1
                )[0, draft_token]
                
                target_prob = torch.softmax(target_logits[:, -(self.gamma-i), :], dim=-1)
                target_token_prob = target_prob[0, draft_token]
                
                # Accept if target_prob >= draft_prob
                if torch.rand(1).item() < (target_token_prob / draft_prob).item():
                    input_ids = torch.cat([input_ids, draft_token], dim=-1)
                    accepted += 1
                else:
                    # Resample from adjusted distribution
                    adjusted = target_prob - draft_prob
                    adjusted = torch.clamp(adjusted, min=0)
                    adjusted = adjusted / adjusted.sum()
                    new_token = torch.multinomial(adjusted, 1)
                    input_ids = torch.cat([input_ids, new_token], dim=-1)
                    accepted += 1
                    break
        
        return input_ids
```

### Speedup
- **2-3x faster** than autoregressive generation
- Depends on draft model quality and acceptance rate

---

## 6. Flash Attention

### What It Is
Memory-efficient attention algorithm that avoids materializing full attention matrix

### Standard Attention vs Flash Attention

```
Standard:  O(N²) memory, O(N²) compute
Flash:     O(N) memory, O(N²) compute (but faster due to IO efficiency)
```

### Implementation

```python
# Using PyTorch's native flash attention
import torch.nn.functional as F

def flash_attention(Q, K, V, causal=True):
    """
    Q, K, V: (batch, heads, seq_len, head_dim)
    """
    # PyTorch 2.0+ has native flash attention
    with torch.backends.cuda.sdp_kernel(
        enable_flash=True,
        enable_math=False,
        enable_mem_efficient=False
    ):
        return F.scaled_dot_product_attention(
            Q, K, V, 
            is_causal=causal,
            scale=Q.size(-1) ** -0.5
        )

# Manual implementation (educational)
def manual_flash_attention(Q, K, V, block_size=128):
    B, H, N, D = Q.shape
    O = torch.zeros_like(Q)
    
    # Tile computation
    for i in range(0, N, block_size):
        Qi = Q[:, :, i:i+block_size, :]
        
        # Online softmax
        m = torch.full((B, H, block_size), float('-inf'))
        l = torch.zeros((B, H, block_size))
        
        for j in range(0, N, block_size):
            Kj = K[:, :, j:j+block_size, :]
            Vj = V[:, :, j:j+block_size, :]
            
            # Compute block attention
            Sij = Qi @ Kj.transpose(-2, -1)
            mij = Sij.max(dim=-1, keepdim=True).values
            Pij = torch.exp(Sij - mij)
            
            # Update running statistics
            m_new = torch.max(m, mij.squeeze(-1))
            l = torch.exp(m - m_new) * l + torch.exp(mij.squeeze(-1) - m_new) * Pij.sum(dim=-1)
            
            # Update output
            O[:, :, i:i+block_size, :] += torch.exp(mij.squeeze(-1) - m_new).unsqueeze(-1) * (Pij @ Vj)
        
        # Normalize
        O[:, :, i:i+block_size, :] /= l.unsqueeze(-1)
    
    return O
```

### Benefits
- **2-4x speedup** on long sequences
- **Memory efficient**: No O(N²) attention matrix
- **Exact**: No approximation

---

## 7. Model Merging

### What It Is
Combine multiple fine-tuned models into one without retraining

### Techniques

#### 7.1 Weight Averaging
```python
def merge_models(models, weights=None):
    """
    Merge multiple models by weighted averaging
    """
    if weights is None:
        weights = [1.0 / len(models)] * len(models)
    
    merged = copy.deepcopy(models[0])
    
    for name, param in merged.named_parameters():
        param.data.zero_()
        for model, weight in zip(models, weights):
            param.data += weight * model.state_dict()[name]
    
    return merged

# Example: Merge 3 expert models
math_expert = load_model("math-finetuned")
code_expert = load_model("code-finetuned")
chat_expert = load_model("chat-finetuned")

merged = merge_models(
    [math_expert, code_expert, chat_expert],
    weights=[0.33, 0.33, 0.34]
)
```

#### 7.2 Task Arithmetic
```python
def task_arithmetic(base_model, task_vectors, alphas):
    """
    base_model: Original pretrained model
    task_vectors: Fine-tuned - Pretrained for each task
    alphas: Scaling factors for each task
    """
    merged = copy.deepcopy(base_model)
    
    for name, param in merged.named_parameters():
        for task_vector, alpha in zip(task_vectors, alphas):
            param.data += alpha * task_vector[name]
    
    return merged
```

---

## Comparison Table

| Technique | Compression | Speedup | Quality Loss | Complexity |
|-----------|-------------|---------|--------------|------------|
| **INT8 Quant** | 4x | 2x | ~1% | Low |
| **INT4 Quant** | 8x | 3x | ~2-5% | Low |
| **Pruning 30%** | 1.4x | 1.3x | ~3% | Medium |
| **Distillation** | 10x+ | 10x+ | ~5% | High |
| **Flash Attention** | 1x | 2-4x | 0% | Low |
| **Speculative** | 1x | 2-3x | 0% | Medium |
| **KV Cache Opt** | 2-4x | 1.5x | ~1% | Medium |

---

## Recommended Stack

### For Production APIs
```python
config = {
    "quantization": "int8",        # 4x smaller
    "attention": "flash",          # 2-4x faster
    "kv_cache": "int8_quantized",  # 4x memory
    "speculative": True,           # 2-3x faster
}
# Total: ~8-16x speedup, ~4x smaller
```

### For Edge Devices
```python
config = {
    "quantization": "int4_gptq",   # 8x smaller
    "pruning": "structured_30%",   # 1.4x smaller
    "distillation": "tiny_model",  # 10x smaller
}
# Total: ~100x smaller, ~10x faster
```

### For Long Context
```python
config = {
    "attention": "flash",          # Memory efficient
    "kv_cache": "sliding_window",  # Fixed memory
    "cache_quantization": "int8",  # 4x cache memory
}
# Total: Handle 100K+ tokens efficiently
```

---

## Tools & Libraries

| Library | Purpose |
|---------|---------|
| **bitsandbytes** | 4/8-bit quantization |
| **auto-gptq** | GPTQ quantization |
| **llama.cpp** | Edge deployment |
| **vLLM** | High-throughput serving |
| **Text Generation Inference** | Production inference |
| **DeepSpeed** | Distributed training/inference |

---

## References

- Dettmers et al. (2022). LLM.int8(): 8-bit Matrix Multiplication
- Frantar et al. (2022). GPTQ: Accurate Post-Training Quantization
- Xiao et al. (2023). SmoothQuant: Accurate and Efficient Post-Training Quantization
- Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention
- Leviathan et al. (2022). Fast Inference from Transformers via Speculative Decoding
