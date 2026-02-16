"""
Reporter Module

Generate reports in various formats (HTML, Markdown, JSON).
"""

import pandas as pd
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime


class Reporter:
    """Generate data analysis reports."""
    
    def __init__(self, config=None):
        self.config = config or {}
        self.template_dir = Path(__file__).parent / "templates"
    
    def generate_html_report(self, df: pd.DataFrame, output_path: str,
                            title: str = "Data Analysis Report",
                            include_plots: bool = True,
                            include_stats: bool = True,
                            charts: Optional[List] = None,
                            insights: Optional[List[str]] = None) -> str:
        """
        Generate HTML report.
        
        Args:
            df: DataFrame to report on
            output_path: Path to save HTML file
            title: Report title
            include_plots: Whether to include visualizations
            include_stats: Whether to include statistics
            charts: List of chart figures to include
            insights: List of insight strings
            
        Returns:
            Path to generated report
        """
        from .analyzer import Analyzer
        
        analyzer = Analyzer()
        profile = analyzer.profile(df)
        
        # Generate HTML
        html_parts = [
            self._html_header(title),
            self._html_summary(profile),
        ]
        
        if include_stats:
            html_parts.append(self._html_statistics(df, profile))
        
        if insights:
            html_parts.append(self._html_insights(insights))
        
        if include_plots and charts:
            html_parts.append(self._html_charts(charts))
        
        html_parts.append(self._html_sample_data(df))
        html_parts.append(self._html_footer())
        
        html_content = "\n".join(html_parts)
        
        # Save
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"HTML report saved to {output_path}")
        return output_path
    
    def _html_header(self, title: str) -> str:
        """Generate HTML header."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{title}</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f5f5f5;
                }}
                .container {{
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }}
                h1 {{
                    color: #333;
                    border-bottom: 3px solid #4CAF50;
                    padding-bottom: 10px;
                }}
                h2 {{
                    color: #555;
                    margin-top: 30px;
                }}
                .stat-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }}
                .stat-card {{
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    border-left: 4px solid #4CAF50;
                }}
                .stat-label {{
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                }}
                .stat-value {{
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }}
                th, td {{
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }}
                th {{
                    background: #4CAF50;
                    color: white;
                }}
                tr:hover {{
                    background: #f5f5f5;
                }}
                .insight {{
                    background: #e3f2fd;
                    padding: 10px 15px;
                    margin: 10px 0;
                    border-radius: 4px;
                    border-left: 4px solid #2196F3;
                }}
                .chart-container {{
                    text-align: center;
                    margin: 20px 0;
                }}
                .chart-container img {{
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                }}
                .timestamp {{
                    color: #999;
                    font-size: 12px;
                    text-align: right;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>{title}</h1>
                <p class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        """
    
    def _html_summary(self, profile) -> str:
        """Generate summary section."""
        return f"""
            </div>
            
            <div class="container">
                <h2>📊 Dataset Overview</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-label">Rows</div>
                        <div class="stat-value">{profile.row_count:,}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Columns</div>
                        <div class="stat-value">{profile.column_count}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Memory Usage</div>
                        <div class="stat-value">{profile.memory_usage}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Missing Values</div>
                        <div class="stat-value">{profile.missing_summary['total_missing']:,}</div>
                    </div>
                </div>
        """
    
    def _html_statistics(self, df: pd.DataFrame, profile) -> str:
        """Generate statistics section."""
        html = "<div class='container'><h2>📈 Statistical Summary</h2>"
        
        if profile.numeric_stats is not None:
            html += "<h3>Numeric Columns</h3>"
            html += profile.numeric_stats.to_html(classes='stats-table')
        
        if profile.categorical_stats:
            html += "<h3>Categorical Columns</h3>"
            for col, stats in profile.categorical_stats.items():
                html += f"<p><strong>{col}</strong>: {stats['unique_count']} unique values</p>"
        
        html += "</div>"
        return html
    
    def _html_insights(self, insights: List[str]) -> str:
        """Generate insights section."""
        html = "<div class='container'><h2>💡 Key Insights</h2>"
        for insight in insights:
            html += f"<div class='insight'>{insight}</div>"
        html += "</div>"
        return html
    
    def _html_charts(self, charts: List) -> str:
        """Generate charts section."""
        import base64
        from io import BytesIO
        
        html = "<div class='container'><h2>📉 Visualizations</h2>"
        
        for i, chart in enumerate(charts):
            if hasattr(chart, 'savefig'):  # Matplotlib figure
                buf = BytesIO()
                chart.savefig(buf, format='png', bbox_inches='tight')
                buf.seek(0)
                img_base64 = base64.b64encode(buf.read()).decode('utf-8')
                html += f"""
                <div class="chart-container">
                    <img src="data:image/png;base64,{img_base64}" alt="Chart {i+1}">
                </div>
                """
        
        html += "</div>"
        return html
    
    def _html_sample_data(self, df: pd.DataFrame, n: int = 10) -> str:
        """Generate sample data section."""
        sample = df.head(n)
        return f"""
            <div class="container">
                <h2>📝 Sample Data (First {n} rows)</h2>
                {sample.to_html(index=False, classes='data-table')}
            </div>
        """
    
    def _html_footer(self) -> str:
        """Generate HTML footer."""
        return """
            <div class="container">
                <p class="timestamp">Report generated by OpenClaw Data Analysis Skill</p>
            </div>
        </body>
        </html>
        """
    
    def generate_markdown_report(self, df: pd.DataFrame, output_path: str,
                                 title: str = "Data Analysis Report") -> str:
        """
        Generate Markdown report.
        
        Args:
            df: DataFrame to report on
            output_path: Path to save Markdown file
            title: Report title
            
        Returns:
            Path to generated report
        """
        from .analyzer import Analyzer
        
        analyzer = Analyzer()
        profile = analyzer.profile(df)
        
        lines = [
            f"# {title}",
            "",
            f"*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*",
            "",
            "## Dataset Overview",
            "",
            f"- **Rows:** {profile.row_count:,}",
            f"- **Columns:** {profile.column_count}",
            f"- **Memory Usage:** {profile.memory_usage}",
            f"- **Missing Values:** {profile.missing_summary['total_missing']:,}",
            "",
            "## Column Types",
            "",
        ]
        
        for col, dtype in profile.dtypes.items():
            lines.append(f"- `{col}`: {dtype}")
        
        lines.extend(["", "## Statistical Summary", ""])
        
        if profile.numeric_stats is not None:
            lines.append("### Numeric Columns")
            lines.append("")
            lines.append(profile.numeric_stats.to_markdown())
            lines.append("")
        
        lines.extend(["## Sample Data", ""])
        lines.append(df.head(10).to_markdown(index=False))
        lines.append("")
        
        # Save
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(lines))
        
        print(f"Markdown report saved to {output_path}")
        return output_path
    
    def generate_json_summary(self, df: pd.DataFrame, 
                              include_sample: bool = False) -> Dict[str, Any]:
        """
        Generate JSON summary.
        
        Args:
            df: DataFrame to summarize
            include_sample: Whether to include sample data
            
        Returns:
            Dictionary with summary data
        """
        from .analyzer import Analyzer
        
        analyzer = Analyzer()
        profile = analyzer.profile(df)
        insights = analyzer.generate_insights(df)
        
        summary = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "row_count": profile.row_count,
                "column_count": profile.column_count,
                "memory_usage": profile.memory_usage
            },
            "columns": {
                col: {
                    "type": dtype,
                    "missing": df[col].isnull().sum(),
                    "missing_pct": round(df[col].isnull().sum() / len(df) * 100, 2)
                }
                for col, dtype in profile.dtypes.items()
            },
            "insights": insights
        }
        
        if profile.numeric_stats is not None:
            summary["numeric_statistics"] = profile.numeric_stats.to_dict()
        
        if include_sample:
            summary["sample_data"] = df.head(10).to_dict(orient='records')
        
        return summary
    
    def save_json_summary(self, df: pd.DataFrame, output_path: str,
                         include_sample: bool = False) -> str:
        """
        Save JSON summary to file.
        
        Args:
            df: DataFrame to summarize
            output_path: Path to save JSON file
            include_sample: Whether to include sample data
            
        Returns:
            Path to generated file
        """
        summary = self.generate_json_summary(df, include_sample)
        
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, default=str)
        
        print(f"JSON summary saved to {output_path}")
        return output_path
