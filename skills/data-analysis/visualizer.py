"""
Visualizer Module

Data visualization using matplotlib, seaborn, and plotly.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Optional, List, Dict, Union, Tuple
from pathlib import Path

# Set default style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['figure.dpi'] = 100


class Visualizer:
    """Create data visualizations."""
    
    def __init__(self, config=None):
        self.config = config or {}
        self.figsize = self.config.get('figure_size', (10, 6))
        self.dpi = self.config.get('dpi', 150)
        self.palette = self.config.get('color_palette', 'viridis')
        self.current_fig = None
    
    def _create_figure(self, figsize=None):
        """Create a new figure."""
        figsize = figsize or self.figsize
        self.current_fig = plt.figure(figsize=figsize, dpi=self.dpi)
        return self.current_fig
    
    def plot_line(self, df: pd.DataFrame, x: Optional[str] = None, 
                  y: Optional[str] = None, title: str = "Line Plot",
                  xlabel: Optional[str] = None, ylabel: Optional[str] = None,
                  **kwargs) -> plt.Figure:
        """
        Create line plot.
        
        Args:
            df: DataFrame or Series
            x: X-axis column
            y: Y-axis column
            title: Plot title
            **kwargs: Additional plot options
            
        Returns:
            matplotlib Figure
        """
        self._create_figure()
        
        if isinstance(df, pd.Series):
            df.plot(kind='line', title=title)
        else:
            if x and y:
                plt.plot(df[x], df[y], **kwargs)
                plt.xlabel(xlabel or x)
                plt.ylabel(ylabel or y)
            else:
                df.plot(kind='line', title=title)
        
        plt.title(title)
        plt.xlabel(xlabel or x or '')
        plt.ylabel(ylabel or y or '')
        plt.tight_layout()
        
        return self.current_fig
    
    def plot_bar(self, df: pd.DataFrame, x: Optional[str] = None,
                 y: Optional[str] = None, title: str = "Bar Plot",
                 horizontal: bool = False, **kwargs) -> plt.Figure:
        """
        Create bar plot.
        
        Args:
            df: DataFrame or Series
            x: X-axis column
            y: Y-axis column
            title: Plot title
            horizontal: Whether to create horizontal bar chart
            **kwargs: Additional plot options
            
        Returns:
            matplotlib Figure
        """
        self._create_figure()
        
        kind = 'barh' if horizontal else 'bar'
        
        if isinstance(df, pd.Series):
            df.plot(kind=kind, title=title, color=sns.color_palette(self.palette, len(df)))
        else:
            if x and y:
                if horizontal:
                    plt.barh(df[x], df[y], color=sns.color_palette(self.palette, len(df)))
                    plt.xlabel(y)
                    plt.ylabel(x)
                else:
                    plt.bar(df[x], df[y], color=sns.color_palette(self.palette, len(df)))
                    plt.xlabel(x)
                    plt.ylabel(y)
            else:
                df.plot(kind=kind, title=title)
        
        plt.title(title)
        plt.tight_layout()
        
        return self.current_fig
    
    def plot_scatter(self, df: pd.DataFrame, x: str, y: str,
                     hue: Optional[str] = None, title: str = "Scatter Plot",
                     **kwargs) -> plt.Figure:
        """
        Create scatter plot.
        
        Args:
            df: DataFrame
            x: X-axis column
            y: Y-axis column
            hue: Column for color grouping
            title: Plot title
            **kwargs: Additional plot options
            
        Returns:
            matplotlib Figure
        """
        self._create_figure()
        
        if hue:
            sns.scatterplot(data=df, x=x, y=y, hue=hue, palette=self.palette, **kwargs)
            plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        else:
            plt.scatter(df[x], df[y], **kwargs)
        
        plt.title(title)
        plt.xlabel(x)
        plt.ylabel(y)
        plt.tight_layout()
        
        return self.current_fig
    
    def plot_histogram(self, df: pd.DataFrame, column: str,
                       bins: int = 30, title: str = "Histogram",
                       kde: bool = True, **kwargs) -> plt.Figure:
        """
        Create histogram.
        
        Args:
            df: DataFrame or Series
            column: Column to plot (if DataFrame)
            bins: Number of bins
            title: Plot title
            kde: Whether to show KDE curve
            **kwargs: Additional plot options
            
        Returns:
            matplotlib Figure
        """
        self._create_figure()
        
        if isinstance(df, pd.DataFrame):
            data = df[column]
        else:
            data = df
            column = column or 'Value'
        
        sns.histplot(data=data, bins=bins, kde=kde, color=sns.color_palette(self.palette)[0], **kwargs)
        
        plt.title(title)
        plt.xlabel(column)
        plt.ylabel('Frequency')
        plt.tight_layout()
        
        return self.current_fig
    
    def plot_box(self, df: pd.DataFrame, column: Optional[str] = None,
                 by: Optional[str] = None, title: str = "Box Plot",
                 **kwargs) -> plt.Figure:
        """
        Create box plot.
        
        Args:
            df: DataFrame
            column: Column to plot
            by: Column to group by
            title: Plot title
            **kwargs: Additional plot options
            
        Returns:
            matplotlib Figure
        """
        self._create_figure()
        
        if by:
            sns.boxplot(data=df, x=by, y=column, palette=self.palette, **kwargs)
            plt.xticks(rotation=45)
        else:
            if isinstance(df, pd.Series):
                sns.boxplot(data=df, palette=self.palette, **kwargs)
            else:
                sns.boxplot(data=df[column], palette=self.palette, **kwargs)
        
        plt.title(title)
        plt.tight_layout()
        
        return self.current_fig
    
    def plot_heatmap(self, df: pd.DataFrame, title: str = "Heatmap",
                     annot: bool = True, cmap: str = "coolwarm",
                     **kwargs) -> plt.Figure:
        """
        Create heatmap.
        
        Args:
            df: DataFrame (typically correlation matrix)
            title: Plot title
            annot: Whether to annotate cells
            cmap: Colormap
            **kwargs: Additional plot options
            
        Returns:
            matplotlib Figure
        """
        self._create_figure(figsize=(max(10, len(df.columns)), max(8, len(df))))
        
        sns.heatmap(df, annot=annot, cmap=cmap, center=0, 
                   square=True, linewidths=0.5, **kwargs)
        
        plt.title(title)
        plt.tight_layout()
        
        return self.current_fig
    
    def plot_pie(self, data: Union[pd.Series, pd.DataFrame], 
                 column: Optional[str] = None,
                 title: str = "Pie Chart", **kwargs) -> plt.Figure:
        """
        Create pie chart.
        
        Args:
            data: Series with values to plot
            column: Column name (if DataFrame)
            title: Plot title
            **kwargs: Additional plot options
            
        Returns:
            matplotlib Figure
        """
        self._create_figure(figsize=(8, 8))
        
        if isinstance(data, pd.DataFrame):
            data = data[column].value_counts()
        
        colors = sns.color_palette(self.palette, len(data))
        
        plt.pie(data.values, labels=data.index, autopct='%1.1f%%',
                colors=colors, startangle=90, **kwargs)
        plt.title(title)
        plt.axis('equal')
        
        return self.current_fig
    
    def plot_multiple(self, df: pd.DataFrame, columns: List[str],
                      x: Optional[str] = None, title: str = "Multi-Series Plot",
                      **kwargs) -> plt.Figure:
        """
        Create multi-series line plot.
        
        Args:
            df: DataFrame
            columns: Columns to plot
            x: X-axis column (if None, uses index)
            title: Plot title
            **kwargs: Additional plot options
            
        Returns:
            matplotlib Figure
        """
        self._create_figure()
        
        x_data = df[x] if x else df.index
        
        for col in columns:
            if col in df.columns:
                plt.plot(x_data, df[col], label=col, **kwargs)
        
        plt.title(title)
        plt.xlabel(x or 'Index')
        plt.ylabel('Value')
        plt.legend()
        plt.tight_layout()
        
        return self.current_fig
    
    def save_plot(self, path: str, dpi: Optional[int] = None, **kwargs):
        """
        Save current plot to file.
        
        Args:
            path: Output file path
            dpi: DPI for output
            **kwargs: Additional save options
        """
        if self.current_fig:
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            self.current_fig.savefig(path, dpi=dpi or self.dpi, 
                                    bbox_inches='tight', **kwargs)
            print(f"Plot saved to {path}")
        else:
            print("No plot to save")
    
    def show_plot(self):
        """Display the current plot."""
        if self.current_fig:
            plt.show()
    
    def close_plot(self):
        """Close the current plot."""
        plt.close(self.current_fig)
        self.current_fig = None
    
    # Plotly Interactive Plots
    def plotly_line(self, df: pd.DataFrame, x: str, y: str,
                    color: Optional[str] = None, title: str = "Line Plot",
                    **kwargs):
        """
        Create interactive line plot with Plotly.
        
        Args:
            df: DataFrame
            x: X-axis column
            y: Y-axis column
            color: Column for color grouping
            title: Plot title
            **kwargs: Additional plot options
            
        Returns:
            Plotly Figure
        """
        try:
            import plotly.express as px
            
            fig = px.line(df, x=x, y=y, color=color, title=title,
                         **kwargs)
            return fig
        except ImportError:
            print("Plotly not installed. Using matplotlib instead.")
            return self.plot_line(df, x=x, y=y, title=title)
    
    def plotly_bar(self, df: pd.DataFrame, x: str, y: str,
                   color: Optional[str] = None, title: str = "Bar Plot",
                   **kwargs):
        """
        Create interactive bar plot with Plotly.
        
        Args:
            df: DataFrame
            x: X-axis column
            y: Y-axis column
            color: Column for color grouping
            title: Plot title
            **kwargs: Additional plot options
            
        Returns:
            Plotly Figure
        """
        try:
            import plotly.express as px
            
            fig = px.bar(df, x=x, y=y, color=color, title=title,
                        **kwargs)
            return fig
        except ImportError:
            print("Plotly not installed. Using matplotlib instead.")
            return self.plot_bar(df, x=x, y=y, title=title)
    
    def plotly_scatter(self, df: pd.DataFrame, x: str, y: str,
                       color: Optional[str] = None, size: Optional[str] = None,
                       title: str = "Scatter Plot", **kwargs):
        """
        Create interactive scatter plot with Plotly.
        
        Args:
            df: DataFrame
            x: X-axis column
            y: Y-axis column
            color: Column for color grouping
            size: Column for marker sizing
            title: Plot title
            **kwargs: Additional plot options
            
        Returns:
            Plotly Figure
        """
        try:
            import plotly.express as px
            
            fig = px.scatter(df, x=x, y=y, color=color, size=size,
                           title=title, **kwargs)
            return fig
        except ImportError:
            print("Plotly not installed. Using matplotlib instead.")
            return self.plot_scatter(df, x=x, y=y, hue=color, title=title)
    
    def plotly_heatmap(self, df: pd.DataFrame, title: str = "Heatmap",
                       **kwargs):
        """
        Create interactive heatmap with Plotly.
        
        Args:
            df: DataFrame (typically correlation matrix)
            title: Plot title
            **kwargs: Additional plot options
            
        Returns:
            Plotly Figure
        """
        try:
            import plotly.express as px
            
            fig = px.imshow(df, text_auto=True, aspect="auto",
                          title=title, **kwargs)
            return fig
        except ImportError:
            print("Plotly not installed. Using matplotlib instead.")
            return self.plot_heatmap(df, title=title)
    
    def save_plotly(self, fig, path: str, **kwargs):
        """
        Save Plotly figure to HTML file.
        
        Args:
            fig: Plotly figure
            path: Output file path
            **kwargs: Additional write_html options
        """
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        fig.write_html(path, **kwargs)
        print(f"Interactive plot saved to {path}")
