/**
 * API Server
 * Express server for Islamic AGI endpoints
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { IslamicAGI } from './core/agi';
import { LLMManager } from './llm/provider';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize AGI
const llmManager = new LLMManager({
  primary: {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-opus-20240229'
  },
  fallback: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview'
  }
});

const agi = new IslamicAGI({ llmManager });

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Main AGI endpoint
app.post('/process', async (req: Request, res: Response) => {
  try {
    const { input, options } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        error: 'Input is required and must be a string'
      });
    }

    console.log(`[${new Date().toISOString()}] Processing: ${input.substring(0, 100)}...`);

    const result = await agi.process(input);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({
      error: 'Internal processing error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fitra check endpoint
app.post('/verify-fitra', (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const { FitraVerifier } = require('./core/fitra');
    const verifier = new FitraVerifier();
    const result = verifier.verify(text);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get ontology info
app.get('/ontology/:concept', (req: Request, res: Response) => {
  try {
    const { IslamicOntology } = require('./knowledge/ontology');
    const ontology = new IslamicOntology();
    const node = ontology.getNode(req.params.concept);

    if (!node) {
      return res.status(404).json({ error: 'Concept not found' });
    }

    res.json({
      success: true,
      data: node
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve ontology' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           Islamic AGI POC Server                           ║
║                                                            ║
║  Status: RUNNING                                           ║
║  Port: ${PORT}                                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                            ║
║  Endpoints:                                                ║
║  - POST /process      - Main AGI processing                ║
║  - POST /verify-fitra - Fitra axiom verification           ║
║  - GET  /health       - Health check                       ║
║  - GET  /ontology/:c  - Ontology lookup                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;