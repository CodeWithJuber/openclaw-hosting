# Data Analysis Skill

A comprehensive data analysis toolkit for AI agents, providing powerful data manipulation, visualization, and reporting capabilities using Python's best-in-class data science libraries.

## Overview

This skill equips AI agents with the ability to:
- Load and process data from CSV, Excel, JSON, and other formats
- Clean and transform messy datasets
- Perform statistical analysis
- Create beautiful visualizations (static and interactive)
- Generate professional reports

## Dependencies

Core libraries:
- **pandas** - Data manipulation and analysis
- **numpy** - Numerical computing
- **matplotlib** - Static plotting
- **seaborn** - Statistical visualization
- **plotly** - Interactive visualizations
- **scipy** - Scientific computing and statistics
- **openpyxl** - Excel file handling
- **jinja2** - Report templating

## Quick Start

```python
from data_analysis import DataAnalyzer

# Initialize analyzer
analyzer = DataAnalyzer()

# Load data
df = analyzer.load_csv("data.csv")

# Quick profile
analyzer.profile(df)

# Create visualization
analyzer.plot_line(df, x="date", y="value", title="Trend Analysis")

# Generate report
analyzer.generate_report(df, output_path="report.html")
```

## Core Modules

### 1. Data Loading (`data_loader.py`)

Load data from various sources:

```python
from data_analysis.data_loader import DataLoader

loader = DataLoader()

# CSV
df = loader.load_csv("path/to/file.csv", encoding="utf-8")

# Excel
df = loader.load_excel("path/to/file.xlsx", sheet_name="Sheet1")

# JSON
df = loader.load_json("path/to/file.json", orient="records")

# Multiple files
df = loader.load_multiple("data/*.csv", concat=True)
```

### 2. Data Cleaning (`data_cleaner.py`)

Clean and preprocess data:

```python
from data_analysis.data_cleaner import DataCleaner

cleaner = DataCleaner()

# Remove duplicates
df = cleaner.remove_duplicates(df)

# Handle missing values
df = cleaner.fill_missing(df, strategy="mean")  # or "median", "mode", "drop"

# Remove outliers
df = cleaner.remove_outliers(df, columns=["price"], method="iqr")

# Standardize column names
df = cleaner.standardize_columns(df)

# Full cleaning pipeline
df = cleaner.clean_pipeline(df, 
    remove_duplicates=True,
    fill_missing="mean",
    remove_outliers=["price", "quantity"]
)
```

### 3. Data Analysis (`analyzer.py`)

Statistical analysis and profiling:

```python
from data_analysis.analyzer import Analyzer

analyzer = Analyzer()

# Quick profile
profile = analyzer.profile(df)
print(profile.summary)
print(profile.numeric_stats)
print(profile.categorical_stats)

# Correlation analysis
corr = analyzer.correlation(df, method="pearson")

# Group analysis
stats = analyzer.group_stats(df, group_by="category", agg={"sales": "sum"})

# Time series analysis
ts_stats = analyzer.time_series_stats(df, date_col="date", value_col="sales")
```

### 4. Visualization (`visualizer.py`)

Create charts and plots:

```python
from data_analysis.visualizer import Visualizer

viz = Visualizer()

# Static plots (matplotlib/seaborn)
viz.plot_line(df, x="date", y="value", title="Trend")
viz.plot_bar(df, x="category", y="sales", title="Sales by Category")
viz.plot_scatter(df, x="x", y="y", hue="category", title="Correlation")
viz.plot_histogram(df, column="value", bins=30, title="Distribution")
viz.plot_heatmap(df, title="Correlation Heatmap")
viz.plot_box(df, column="value", by="category", title="Box Plot")

# Interactive plots (plotly)
viz.plotly_line(df, x="date", y="value", title="Interactive Trend")
viz.plotly_bar(df, x="category", y="sales", title="Interactive Bar")
viz.plotly_scatter(df, x="x", y="y", color="category", title="Interactive Scatter")

# Save plots
viz.save_plot("chart.png", dpi=300)
viz.save_plotly("chart.html")
```

### 5. Report Generation (`reporter.py`)

Generate professional reports:

```python
from data_analysis.reporter import Reporter

reporter = Reporter()

# HTML report
reporter.generate_html_report(
    df,
    title="Data Analysis Report",
    output_path="report.html",
    include_plots=True,
    include_stats=True
)

# Markdown report
reporter.generate_markdown_report(
    df,
    title="Analysis Summary",
    output_path="report.md"
)

# JSON summary
summary = reporter.generate_json_summary(df)
```

## Usage Examples

### Example 1: Sales Data Analysis

```python
from data_analysis import DataAnalyzer

analyzer = DataAnalyzer()

# Load sales data
df = analyzer.load_csv("sales_2024.csv")

# Clean data
df = analyzer.clean(df, 
    fill_missing=0,
    remove_duplicates=True,
    parse_dates=["order_date"]
)

# Analysis
monthly_sales = df.groupby(df['order_date'].dt.to_period('M'))['amount'].sum()
top_products = df.groupby('product')['amount'].sum().nlargest(10)

# Visualizations
analyzer.plot_line(monthly_sales, title="Monthly Sales Trend")
analyzer.plot_bar(top_products, title="Top 10 Products")

# Generate report
analyzer.generate_report(df, "sales_report.html")
```

### Example 2: Customer Segmentation

```python
from data_analysis import DataAnalyzer
import pandas as pd

analyzer = DataAnalyzer()

# Load customer data
df = analyzer.load_excel("customers.xlsx")

# RFM Analysis
df['recency'] = (pd.Timestamp.now() - df['last_purchase']).dt.days
df['frequency'] = df['purchase_count']
df['monetary'] = df['total_spent']

# Segment customers
df['segment'] = analyzer.segment_rfm(df, r_col='recency', f_col='frequency', m_col='monetary')

# Visualize segments
analyzer.plot_pie(df['segment'].value_counts(), title="Customer Segments")
analyzer.plot_scatter(df, x='recency', y='monetary', color='segment', title="RFM Analysis")
```

### Example 3: Time Series Forecasting Prep

```python
from data_analysis import DataAnalyzer

analyzer = DataAnalyzer()

# Load time series data
df = analyzer.load_csv("stock_prices.csv", parse_dates=["date"])

# Resample to daily
df_daily = df.resample('D', on='date').mean()

# Calculate moving averages
df_daily['ma_7'] = df_daily['close'].rolling(7).mean()
df_daily['ma_30'] = df_daily['close'].rolling(30).mean()

# Plot with multiple series
analyzer.plot_multiple(
    df_daily,
    columns=['close', 'ma_7', 'ma_30'],
    title="Stock Price with Moving Averages"
)
```

## Configuration

Create a `data_analysis_config.json` file:

```json
{
  "default_plot_style": "seaborn",
  "figure_size": [10, 6],
  "dpi": 150,
  "color_palette": "viridis",
  "date_format": "%Y-%m-%d",
  "decimal_places": 2,
  "max_categories": 20,
  "outlier_method": "iqr",
  "outlier_threshold": 1.5
}
```

## Best Practices

1. **Always profile data first** - Use `analyzer.profile()` to understand your data
2. **Handle missing values explicitly** - Don't assume defaults are correct
3. **Validate data types** - Ensure dates are parsed correctly
4. **Save intermediate results** - Don't lose work after cleaning
5. **Use interactive plots for exploration** - Static plots for reports
6. **Document transformations** - Keep track of cleaning steps

## Common Patterns

### Pattern 1: ETL Pipeline

```python
def etl_pipeline(source_path, output_path):
    analyzer = DataAnalyzer()
    
    # Extract
    df = analyzer.load_csv(source_path)
    
    # Transform
    df = analyzer.clean(df)
    df = analyzer.transform(df, {
        'price': lambda x: x * 1.08,  # Add tax
        'category': lambda x: x.str.upper()
    })
    
    # Load
    df.to_csv(output_path, index=False)
    return df
```

### Pattern 2: Automated Reporting

```python
def weekly_report(data_dir, output_dir):
    analyzer = DataAnalyzer()
    
    # Load week's data
    df = analyzer.load_multiple(f"{data_dir}/*.csv")
    
    # Generate insights
    insights = analyzer.generate_insights(df)
    
    # Create visualizations
    charts = [
        analyzer.plot_line(df, x='date', y='revenue'),
        analyzer.plot_bar(df.groupby('product')['sales'].sum()),
        analyzer.plot_heatmap(df.corr())
    ]
    
    # Compile report
    reporter = Reporter()
    reporter.generate_html_report(
        df,
        title="Weekly Business Report",
        charts=charts,
        insights=insights,
        output_path=f"{output_dir}/report_{datetime.now():%Y%m%d}.html"
    )
```

## Error Handling

All functions include comprehensive error handling:

```python
from data_analysis.exceptions import DataLoadError, AnalysisError

try:
    df = analyzer.load_csv("data.csv")
except DataLoadError as e:
    print(f"Failed to load data: {e}")
    
try:
    stats = analyzer.correlation(df)
except AnalysisError as e:
    print(f"Analysis failed: {e}")
```

## Integration with OpenClaw

Use this skill in your agent:

```python
# In your agent code
from skills.data_analysis import DataAnalyzer

class MyAgent:
    def analyze_user_data(self, file_path):
        analyzer = DataAnalyzer()
        df = analyzer.load_csv(file_path)
        profile = analyzer.profile(df)
        
        # Return insights to user
        return {
            "rows": profile.row_count,
            "columns": profile.column_count,
            "missing_values": profile.missing_summary,
            "suggested_charts": profile.suggested_visualizations
        }
```

## Tips for AI Agents

1. **Ask about data context** - Understanding the domain helps choose the right analysis
2. **Suggest visualizations** - Based on data types, recommend appropriate charts
3. **Handle large datasets** - Use sampling for initial exploration
4. **Explain transformations** - Tell users what cleaning steps were applied
5. **Provide code snippets** - Let users reproduce the analysis
6. **Cache results** - Avoid reprocessing for report generation

## License

MIT License - Part of OpenClaw Skills Collection
