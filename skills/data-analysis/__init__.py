"""
Data Analysis Skill - Main Entry Point

A comprehensive toolkit for data manipulation, visualization, and reporting.
"""

from .data_loader import DataLoader
from .data_cleaner import DataCleaner
from .analyzer import Analyzer
from .visualizer import Visualizer
from .reporter import Reporter


class DataAnalyzer:
    """
    Unified interface for all data analysis operations.
    
    This class combines loading, cleaning, analysis, visualization,
    and reporting into a single convenient interface.
    """
    
    def __init__(self, config=None):
        """
        Initialize the DataAnalyzer.
        
        Args:
            config (dict, optional): Configuration options
        """
        self.config = config or {}
        self.loader = DataLoader(self.config)
        self.cleaner = DataCleaner(self.config)
        self.analyzer = Analyzer(self.config)
        self.visualizer = Visualizer(self.config)
        self.reporter = Reporter(self.config)
    
    # Data Loading
    def load_csv(self, path, **kwargs):
        """Load CSV file."""
        return self.loader.load_csv(path, **kwargs)
    
    def load_excel(self, path, **kwargs):
        """Load Excel file."""
        return self.loader.load_excel(path, **kwargs)
    
    def load_json(self, path, **kwargs):
        """Load JSON file."""
        return self.loader.load_json(path, **kwargs)
    
    def load_multiple(self, pattern, **kwargs):
        """Load multiple files matching pattern."""
        return self.loader.load_multiple(pattern, **kwargs)
    
    # Data Cleaning
    def clean(self, df, **kwargs):
        """Apply full cleaning pipeline."""
        return self.cleaner.clean_pipeline(df, **kwargs)
    
    def remove_duplicates(self, df, **kwargs):
        """Remove duplicate rows."""
        return self.cleaner.remove_duplicates(df, **kwargs)
    
    def fill_missing(self, df, **kwargs):
        """Fill missing values."""
        return self.cleaner.fill_missing(df, **kwargs)
    
    def remove_outliers(self, df, **kwargs):
        """Remove outliers."""
        return self.cleaner.remove_outliers(df, **kwargs)
    
    # Analysis
    def profile(self, df, **kwargs):
        """Generate data profile."""
        return self.analyzer.profile(df, **kwargs)
    
    def correlation(self, df, **kwargs):
        """Calculate correlation matrix."""
        return self.analyzer.correlation(df, **kwargs)
    
    def group_stats(self, df, **kwargs):
        """Calculate grouped statistics."""
        return self.analyzer.group_stats(df, **kwargs)
    
    def time_series_stats(self, df, **kwargs):
        """Calculate time series statistics."""
        return self.analyzer.time_series_stats(df, **kwargs)
    
    def segment_rfm(self, df, **kwargs):
        """Perform RFM segmentation."""
        return self.analyzer.segment_rfm(df, **kwargs)
    
    def generate_insights(self, df, **kwargs):
        """Generate automated insights."""
        return self.analyzer.generate_insights(df, **kwargs)
    
    # Visualization
    def plot_line(self, df, **kwargs):
        """Create line plot."""
        return self.visualizer.plot_line(df, **kwargs)
    
    def plot_bar(self, df, **kwargs):
        """Create bar plot."""
        return self.visualizer.plot_bar(df, **kwargs)
    
    def plot_scatter(self, df, **kwargs):
        """Create scatter plot."""
        return self.visualizer.plot_scatter(df, **kwargs)
    
    def plot_histogram(self, df, **kwargs):
        """Create histogram."""
        return self.visualizer.plot_histogram(df, **kwargs)
    
    def plot_box(self, df, **kwargs):
        """Create box plot."""
        return self.visualizer.plot_box(df, **kwargs)
    
    def plot_heatmap(self, df, **kwargs):
        """Create heatmap."""
        return self.visualizer.plot_heatmap(df, **kwargs)
    
    def plot_pie(self, df, **kwargs):
        """Create pie chart."""
        return self.visualizer.plot_pie(df, **kwargs)
    
    def plot_multiple(self, df, **kwargs):
        """Create multi-series plot."""
        return self.visualizer.plot_multiple(df, **kwargs)
    
    # Interactive Plotly
    def plotly_line(self, df, **kwargs):
        """Create interactive line plot."""
        return self.visualizer.plotly_line(df, **kwargs)
    
    def plotly_bar(self, df, **kwargs):
        """Create interactive bar plot."""
        return self.visualizer.plotly_bar(df, **kwargs)
    
    def plotly_scatter(self, df, **kwargs):
        """Create interactive scatter plot."""
        return self.visualizer.plotly_scatter(df, **kwargs)
    
    def plotly_heatmap(self, df, **kwargs):
        """Create interactive heatmap."""
        return self.visualizer.plotly_heatmap(df, **kwargs)
    
    # Reporting
    def generate_report(self, df, output_path, **kwargs):
        """Generate comprehensive report."""
        return self.reporter.generate_html_report(df, output_path=output_path, **kwargs)
    
    def generate_markdown_report(self, df, output_path, **kwargs):
        """Generate Markdown report."""
        return self.reporter.generate_markdown_report(df, output_path=output_path, **kwargs)
    
    def generate_json_summary(self, df, **kwargs):
        """Generate JSON summary."""
        return self.reporter.generate_json_summary(df, **kwargs)


__all__ = [
    'DataAnalyzer',
    'DataLoader',
    'DataCleaner',
    'Analyzer',
    'Visualizer',
    'Reporter'
]
