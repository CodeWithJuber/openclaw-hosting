"""
Demo Analysis Script

Demonstrates the data analysis skill capabilities.
"""

import sys
sys.path.insert(0, str(__file__).parent.parent)

import pandas as pd
import numpy as np
from data_analysis import DataAnalyzer


def create_sample_data():
    """Create sample sales data for demonstration."""
    np.random.seed(42)
    
    n_records = 1000
    dates = pd.date_range(start='2024-01-01', periods=n_records, freq='H')
    
    data = {
        'timestamp': dates,
        'product': np.random.choice(['Laptop', 'Phone', 'Tablet', 'Watch', 'Headphones'], n_records),
        'category': np.random.choice(['Electronics', 'Accessories'], n_records),
        'price': np.random.uniform(50, 2000, n_records).round(2),
        'quantity': np.random.randint(1, 10, n_records),
        'customer_id': np.random.randint(1000, 1100, n_records),
        'region': np.random.choice(['North', 'South', 'East', 'West'], n_records),
    }
    
    df = pd.DataFrame(data)
    df['revenue'] = (df['price'] * df['quantity']).round(2)
    
    # Add some missing values
    missing_idx = np.random.choice(df.index, size=50, replace=False)
    df.loc[missing_idx[:25], 'price'] = np.nan
    df.loc[missing_idx[25:], 'region'] = np.nan
    
    # Add some duplicates
    duplicates = df.sample(50)
    df = pd.concat([df, duplicates], ignore_index=True)
    
    return df


def main():
    print("=" * 60)
    print("OpenClaw Data Analysis Skill - Demo")
    print("=" * 60)
    
    # Initialize analyzer
    analyzer = DataAnalyzer()
    
    # Create sample data
    print("\n1. Creating sample sales data...")
    df = create_sample_data()
    print(f"   Created dataset with {len(df)} rows and {len(df.columns)} columns")
    
    # Data profiling
    print("\n2. Data Profiling...")
    profile = analyzer.profile(df)
    print(profile.summary)
    print(f"\n   Missing values: {profile.missing_summary['total_missing']}")
    
    # Data cleaning
    print("\n3. Data Cleaning...")
    df_clean = analyzer.clean(
        df,
        remove_duplicates=True,
        fill_missing='mean',
        standardize_columns=True
    )
    
    # Analysis
    print("\n4. Statistical Analysis...")
    
    # Group analysis
    print("\n   Revenue by Product:")
    product_stats = analyzer.group_stats(
        df_clean, 
        group_by='product',
        agg={'revenue': ['sum', 'mean', 'count']}
    )
    print(product_stats)
    
    # Correlation
    print("\n   Correlation Matrix (numeric columns):")
    corr = analyzer.correlation(df_clean)
    print(corr.round(2))
    
    # Generate insights
    print("\n5. Automated Insights:")
    insights = analyzer.generate_insights(df_clean)
    for i, insight in enumerate(insights, 1):
        print(f"   {i}. {insight}")
    
    # Visualizations
    print("\n6. Creating Visualizations...")
    
    # Revenue by product
    revenue_by_product = df_clean.groupby('product')['revenue'].sum().sort_values(ascending=False)
    fig1 = analyzer.plot_bar(
        revenue_by_product,
        title="Total Revenue by Product",
        ylabel="Revenue ($)"
    )
    analyzer.visualizer.save_plot("output/revenue_by_product.png")
    print("   Saved: output/revenue_by_product.png")
    
    # Price distribution
    fig2 = analyzer.plot_histogram(
        df_clean,
        column='price',
        title="Price Distribution",
        bins=30
    )
    analyzer.visualizer.save_plot("output/price_distribution.png")
    print("   Saved: output/price_distribution.png")
    
    # Correlation heatmap
    fig3 = analyzer.plot_heatmap(
        corr,
        title="Correlation Heatmap",
        annot=True
    )
    analyzer.visualizer.save_plot("output/correlation_heatmap.png")
    print("   Saved: output/correlation_heatmap.png")
    
    # Time series
    df_hourly = df_clean.set_index('timestamp').resample('D')['revenue'].sum()
    fig4 = analyzer.plot_line(
        df_hourly,
        title="Daily Revenue Trend",
        ylabel="Revenue ($)"
    )
    analyzer.visualizer.save_plot("output/revenue_trend.png")
    print("   Saved: output/revenue_trend.png")
    
    # Interactive plotly chart
    print("\n7. Creating Interactive Chart...")
    fig_plotly = analyzer.plotly_bar(
        df_clean.groupby('region')['revenue'].sum().reset_index(),
        x='region',
        y='revenue',
        title="Revenue by Region (Interactive)"
    )
    analyzer.visualizer.save_plotly(fig_plotly, "output/revenue_by_region.html")
    print("   Saved: output/revenue_by_region.html")
    
    # Generate reports
    print("\n8. Generating Reports...")
    
    # HTML report
    analyzer.generate_report(
        df_clean,
        output_path="output/analysis_report.html",
        title="Sales Data Analysis Report",
        include_plots=True,
        include_stats=True
    )
    print("   Saved: output/analysis_report.html")
    
    # Markdown report
    analyzer.generate_markdown_report(
        df_clean,
        output_path="output/analysis_report.md",
        title="Sales Data Analysis Report"
    )
    print("   Saved: output/analysis_report.md")
    
    # JSON summary
    analyzer.reporter.save_json_summary(
        df_clean,
        output_path="output/analysis_summary.json"
    )
    print("   Saved: output/analysis_summary.json")
    
    print("\n" + "=" * 60)
    print("Demo Complete!")
    print("=" * 60)
    print("\nGenerated files:")
    print("  - output/revenue_by_product.png")
    print("  - output/price_distribution.png")
    print("  - output/correlation_heatmap.png")
    print("  - output/revenue_trend.png")
    print("  - output/revenue_by_region.html (interactive)")
    print("  - output/analysis_report.html")
    print("  - output/analysis_report.md")
    print("  - output/analysis_summary.json")


if __name__ == "__main__":
    main()
