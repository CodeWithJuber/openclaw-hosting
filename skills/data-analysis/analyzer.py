"""
Analyzer Module

Statistical analysis and data profiling.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class DataProfile:
    """Data profiling results container."""
    row_count: int
    column_count: int
    memory_usage: str
    dtypes: Dict[str, str]
    missing_summary: Dict[str, Any]
    numeric_stats: Optional[pd.DataFrame]
    categorical_stats: Optional[pd.DataFrame]
    summary: str


class Analyzer:
    """Statistical analysis and data profiling."""
    
    def __init__(self, config=None):
        self.config = config or {}
        self.decimal_places = self.config.get('decimal_places', 2)
    
    def profile(self, df: pd.DataFrame) -> DataProfile:
        """
        Generate comprehensive data profile.
        
        Args:
            df: Input DataFrame
            
        Returns:
            DataProfile object with analysis results
        """
        # Basic info
        row_count = len(df)
        column_count = len(df.columns)
        memory_usage = f"{df.memory_usage(deep=True).sum() / 1024**2:.2f} MB"
        
        # Data types
        dtypes = df.dtypes.astype(str).to_dict()
        
        # Missing values
        missing = df.isnull().sum()
        missing_pct = (missing / row_count * 100).round(2)
        missing_summary = {
            'total_missing': missing.sum(),
            'columns_with_missing': missing[missing > 0].to_dict(),
            'missing_percentages': missing_pct[missing_pct > 0].to_dict()
        }
        
        # Numeric statistics
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            numeric_stats = df[numeric_cols].describe().round(self.decimal_places)
        else:
            numeric_stats = None
        
        # Categorical statistics
        cat_cols = df.select_dtypes(include=['object', 'category']).columns
        categorical_stats = {}
        for col in cat_cols:
            categorical_stats[col] = {
                'unique_count': df[col].nunique(),
                'top_values': df[col].value_counts().head(5).to_dict()
            }
        
        # Generate summary text
        summary = self._generate_summary(df, row_count, column_count, missing_summary)
        
        return DataProfile(
            row_count=row_count,
            column_count=column_count,
            memory_usage=memory_usage,
            dtypes=dtypes,
            missing_summary=missing_summary,
            numeric_stats=numeric_stats,
            categorical_stats=categorical_stats if categorical_stats else None,
            summary=summary
        )
    
    def _generate_summary(self, df: pd.DataFrame, rows: int, cols: int, 
                          missing: Dict) -> str:
        """Generate human-readable summary."""
        lines = [
            f"Dataset contains {rows:,} rows and {cols} columns.",
            f"Memory usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB"
        ]
        
        if missing['total_missing'] > 0:
            lines.append(f"Found {missing['total_missing']:,} missing values across "
                        f"{len(missing['columns_with_missing'])} columns.")
        else:
            lines.append("No missing values found.")
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            lines.append(f"Numeric columns: {', '.join(numeric_cols)}")
        
        cat_cols = df.select_dtypes(include=['object', 'category']).columns
        if len(cat_cols) > 0:
            lines.append(f"Categorical columns: {', '.join(cat_cols)}")
        
        date_cols = df.select_dtypes(include=['datetime64']).columns
        if len(date_cols) > 0:
            lines.append(f"DateTime columns: {', '.join(date_cols)}")
        
        return "\n".join(lines)
    
    def correlation(self, df: pd.DataFrame, method: str = 'pearson',
                    min_periods: int = 1) -> pd.DataFrame:
        """
        Calculate correlation matrix.
        
        Args:
            df: Input DataFrame
            method: 'pearson', 'spearman', or 'kendall'
            min_periods: Minimum number of observations
            
        Returns:
            Correlation matrix DataFrame
        """
        numeric_df = df.select_dtypes(include=[np.number])
        if numeric_df.empty:
            raise ValueError("No numeric columns found for correlation")
        
        return numeric_df.corr(method=method, min_periods=min_periods)
    
    def group_stats(self, df: pd.DataFrame, group_by: Union[str, List[str]],
                    agg: Optional[Dict] = None) -> pd.DataFrame:
        """
        Calculate grouped statistics.
        
        Args:
            df: Input DataFrame
            group_by: Column(s) to group by
            agg: Aggregation dict (e.g., {'sales': 'sum', 'price': 'mean'})
            
        Returns:
            Grouped statistics DataFrame
        """
        if agg is None:
            # Default aggregations for numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            agg = {col: ['mean', 'std', 'min', 'max'] for col in numeric_cols}
        
        grouped = df.groupby(group_by).agg(agg).round(self.decimal_places)
        return grouped
    
    def time_series_stats(self, df: pd.DataFrame, date_col: str,
                          value_col: str, freq: Optional[str] = None) -> Dict:
        """
        Calculate time series statistics.
        
        Args:
            df: Input DataFrame
            date_col: DateTime column name
            value_col: Value column name
            freq: Frequency for resampling ('D', 'W', 'M', 'Y')
            
        Returns:
            Dictionary with time series statistics
        """
        if date_col not in df.columns:
            raise ValueError(f"Date column '{date_col}' not found")
        if value_col not in df.columns:
            raise ValueError(f"Value column '{value_col}' not found")
        
        df = df.copy()
        if not pd.api.types.is_datetime64_any_dtype(df[date_col]):
            df[date_col] = pd.to_datetime(df[date_col])
        
        df = df.sort_values(date_col)
        values = df[value_col]
        
        stats = {
            'start_date': df[date_col].min(),
            'end_date': df[date_col].max(),
            'total_periods': len(df),
            'mean': round(values.mean(), self.decimal_places),
            'std': round(values.std(), self.decimal_places),
            'min': round(values.min(), self.decimal_places),
            'max': round(values.max(), self.decimal_places),
            'trend': self._calculate_trend(values)
        }
        
        if freq:
            resampled = df.set_index(date_col)[value_col].resample(freq).mean()
            stats['resampled_mean'] = round(resampled.mean(), self.decimal_places)
            stats['resampled_std'] = round(resampled.std(), self.decimal_places)
        
        return stats
    
    def _calculate_trend(self, series: pd.Series) -> str:
        """Calculate trend direction."""
        first_half = series.iloc[:len(series)//2].mean()
        second_half = series.iloc[len(series)//2:].mean()
        
        diff = second_half - first_half
        pct_change = (diff / first_half * 100) if first_half != 0 else 0
        
        if pct_change > 5:
            return f"increasing (+{pct_change:.1f}%)"
        elif pct_change < -5:
            return f"decreasing ({pct_change:.1f}%)"
        else:
            return f"stable ({pct_change:+.1f}%)"
    
    def segment_rfm(self, df: pd.DataFrame, r_col: str, f_col: str, m_col: str,
                    n_segments: int = 4) -> pd.Series:
        """
        Perform RFM (Recency, Frequency, Monetary) segmentation.
        
        Args:
            df: Input DataFrame
            r_col: Recency column (lower is better)
            f_col: Frequency column (higher is better)
            m_col: Monetary column (higher is better)
            n_segments: Number of segments per dimension
            
        Returns:
            Series with segment labels
        """
        # Calculate quintiles
        r_quintiles = pd.qcut(df[r_col], n_segments, labels=False, duplicates='drop')
        f_quintiles = pd.qcut(df[f_col].rank(method='first'), n_segments, labels=False, duplicates='drop')
        m_quintiles = pd.qcut(df[m_col].rank(method='first'), n_segments, labels=False, duplicates='drop')
        
        # For recency, lower is better, so invert
        r_score = n_segments - 1 - r_quintiles
        f_score = f_quintiles
        m_score = m_quintiles
        
        # Combined RFM score
        rfm_score = r_score + f_score + m_score
        
        # Segment labels
        segment_labels = {
            0: 'Lost',
            1: 'At Risk',
            2: 'Potential Loyalist',
            3: 'Loyal Customer',
            4: 'Champion'
        }
        
        # Map scores to segments
        max_score = (n_segments - 1) * 3
        segment_bins = pd.cut(rfm_score, bins=n_segments, labels=False)
        
        return segment_bins.map(lambda x: segment_labels.get(min(x, 4), 'Other'))
    
    def generate_insights(self, df: pd.DataFrame, target_col: Optional[str] = None) -> List[str]:
        """
        Generate automated insights about the data.
        
        Args:
            df: Input DataFrame
            target_col: Optional target column for specific insights
            
        Returns:
            List of insight strings
        """
        insights = []
        profile = self.profile(df)
        
        # Basic insights
        insights.append(f"Dataset has {profile.row_count:,} rows and {profile.column_count} columns")
        
        # Missing data insights
        if profile.missing_summary['total_missing'] > 0:
            missing_cols = len(profile.missing_summary['columns_with_missing'])
            insights.append(f"{missing_cols} columns have missing values")
        
        # Numeric insights
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols[:3]:  # Top 3 numeric columns
            mean_val = df[col].mean()
            std_val = df[col].std()
            cv = (std_val / mean_val * 100) if mean_val != 0 else 0
            
            if cv > 50:
                insights.append(f"{col} has high variability (CV: {cv:.1f}%)")
            
            skew = df[col].skew()
            if abs(skew) > 1:
                direction = "right" if skew > 0 else "left"
                insights.append(f"{col} is skewed to the {direction}")
        
        # Correlation insights
        if len(numeric_cols) >= 2:
            corr = self.correlation(df)
            # Find highest correlation (excluding self-correlations)
            corr_pairs = []
            for i in range(len(corr.columns)):
                for j in range(i+1, len(corr.columns)):
                    corr_pairs.append((corr.iloc[i, j], corr.columns[i], corr.columns[j]))
            
            if corr_pairs:
                corr_pairs.sort(reverse=True, key=lambda x: abs(x[0]))
                top_corr = corr_pairs[0]
                if abs(top_corr[0]) > 0.7:
                    direction = "positive" if top_corr[0] > 0 else "negative"
                    insights.append(f"Strong {direction} correlation between {top_corr[1]} and {top_corr[2]} "
                                  f"(r={top_corr[0]:.2f})")
        
        return insights
