"""
Data Cleaner Module

Handles data cleaning, preprocessing, and transformation.
"""

import pandas as pd
import numpy as np
from typing import Union, List, Dict, Callable, Optional


class DataCleaner:
    """Clean and preprocess data."""
    
    def __init__(self, config=None):
        self.config = config or {}
        self.outlier_method = self.config.get('outlier_method', 'iqr')
        self.outlier_threshold = self.config.get('outlier_threshold', 1.5)
    
    def remove_duplicates(self, df: pd.DataFrame, subset: Optional[List[str]] = None, 
                          keep: str = 'first') -> pd.DataFrame:
        """
        Remove duplicate rows.
        
        Args:
            df: Input DataFrame
            subset: Columns to consider for duplicates
            keep: Which duplicate to keep ('first', 'last', False)
            
        Returns:
            Cleaned DataFrame
        """
        before = len(df)
        df = df.drop_duplicates(subset=subset, keep=keep)
        after = len(df)
        print(f"Removed {before - after} duplicate rows")
        return df
    
    def fill_missing(self, df: pd.DataFrame, strategy: Union[str, Dict] = 'mean',
                     fill_value: Optional[Dict] = None) -> pd.DataFrame:
        """
        Fill missing values.
        
        Args:
            df: Input DataFrame
            strategy: 'mean', 'median', 'mode', 'drop', or dict of column-specific strategies
            fill_value: Dict of specific values to fill for each column
            
        Returns:
            DataFrame with filled values
        """
        df = df.copy()
        
        if fill_value:
            for col, val in fill_value.items():
                df[col] = df[col].fillna(val)
            return df
        
        if isinstance(strategy, dict):
            for col, strat in strategy.items():
                if col not in df.columns:
                    continue
                    
                if strat == 'mean' and df[col].dtype in ['int64', 'float64']:
                    df[col] = df[col].fillna(df[col].mean())
                elif strat == 'median' and df[col].dtype in ['int64', 'float64']:
                    df[col] = df[col].fillna(df[col].median())
                elif strat == 'mode':
                    df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else None)
                elif strat == 'drop':
                    df = df.dropna(subset=[col])
                elif strat == 'ffill':
                    df[col] = df[col].fillna(method='ffill')
                elif strat == 'bfill':
                    df[col] = df[col].fillna(method='bfill')
        else:
            # Global strategy
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            if strategy == 'mean':
                for col in numeric_cols:
                    df[col] = df[col].fillna(df[col].mean())
            elif strategy == 'median':
                for col in numeric_cols:
                    df[col] = df[col].fillna(df[col].median())
            elif strategy == 'mode':
                for col in df.columns:
                    df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else None)
            elif strategy == 'drop':
                df = df.dropna()
            elif strategy == 'ffill':
                df = df.fillna(method='ffill')
            elif strategy == 'bfill':
                df = df.fillna(method='bfill')
        
        return df
    
    def remove_outliers(self, df: pd.DataFrame, columns: Optional[List[str]] = None,
                        method: str = 'iqr', threshold: float = 1.5) -> pd.DataFrame:
        """
        Remove outliers from numeric columns.
        
        Args:
            df: Input DataFrame
            columns: Columns to check (default: all numeric)
            method: 'iqr' or 'zscore'
            threshold: Threshold for outlier detection
            
        Returns:
            DataFrame with outliers removed
        """
        df = df.copy()
        
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns.tolist()
        
        before = len(df)
        
        for col in columns:
            if col not in df.columns:
                continue
                
            if method == 'iqr':
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower = Q1 - threshold * IQR
                upper = Q3 + threshold * IQR
                df = df[(df[col] >= lower) & (df[col] <= upper)]
            
            elif method == 'zscore':
                from scipy import stats
                z_scores = np.abs(stats.zscore(df[col].dropna()))
                df = df[z_scores < threshold]
        
        after = len(df)
        print(f"Removed {before - after} outlier rows")
        return df
    
    def standardize_columns(self, df: pd.DataFrame, lowercase: bool = True,
                           replace_spaces: str = '_') -> pd.DataFrame:
        """
        Standardize column names.
        
        Args:
            df: Input DataFrame
            lowercase: Convert to lowercase
            replace_spaces: Character to replace spaces with
            
        Returns:
            DataFrame with standardized column names
        """
        df = df.copy()
        cols = df.columns
        
        if lowercase:
            cols = cols.str.lower()
        
        cols = cols.str.replace(' ', replace_spaces)
        cols = cols.str.replace('-', replace_spaces)
        cols = cols.str.replace(r'[^\w' + replace_spaces + ']', '', regex=True)
        
        df.columns = cols
        return df
    
    def convert_types(self, df: pd.DataFrame, type_map: Dict[str, str]) -> pd.DataFrame:
        """
        Convert column data types.
        
        Args:
            df: Input DataFrame
            type_map: Dict mapping column names to types
            
        Returns:
            DataFrame with converted types
        """
        df = df.copy()
        
        for col, dtype in type_map.items():
            if col not in df.columns:
                continue
                
            try:
                if dtype == 'datetime':
                    df[col] = pd.to_datetime(df[col], errors='coerce')
                elif dtype == 'category':
                    df[col] = df[col].astype('category')
                elif dtype == 'numeric':
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                elif dtype == 'string':
                    df[col] = df[col].astype(str)
                else:
                    df[col] = df[col].astype(dtype)
            except Exception as e:
                print(f"Warning: Could not convert {col} to {dtype}: {e}")
        
        return df
    
    def trim_whitespace(self, df: pd.DataFrame, columns: Optional[List[str]] = None) -> pd.DataFrame:
        """
        Trim whitespace from string columns.
        
        Args:
            df: Input DataFrame
            columns: Columns to trim (default: all string columns)
            
        Returns:
            DataFrame with trimmed strings
        """
        df = df.copy()
        
        if columns is None:
            columns = df.select_dtypes(include=['object']).columns
        
        for col in columns:
            if col in df.columns:
                df[col] = df[col].str.strip()
        
        return df
    
    def clean_pipeline(self, df: pd.DataFrame, 
                       remove_duplicates: bool = True,
                       fill_missing: Optional[str] = None,
                       remove_outliers: Optional[List[str]] = None,
                       standardize_columns: bool = True,
                       trim_whitespace: bool = True,
                       type_conversions: Optional[Dict] = None) -> pd.DataFrame:
        """
        Apply full cleaning pipeline.
        
        Args:
            df: Input DataFrame
            remove_duplicates: Whether to remove duplicates
            fill_missing: Strategy for filling missing values
            remove_outliers: Columns to remove outliers from
            standardize_columns: Whether to standardize column names
            trim_whitespace: Whether to trim whitespace
            type_conversions: Dict of column type conversions
            
        Returns:
            Cleaned DataFrame
        """
        print(f"Starting cleaning pipeline. Original shape: {df.shape}")
        
        if standardize_columns:
            df = self.standardize_columns(df)
        
        if trim_whitespace:
            df = self.trim_whitespace(df)
        
        if remove_duplicates:
            df = self.remove_duplicates(df)
        
        if fill_missing:
            df = self.fill_missing(df, strategy=fill_missing)
        
        if remove_outliers:
            df = self.remove_outliers(df, columns=remove_outliers)
        
        if type_conversions:
            df = self.convert_types(df, type_conversions)
        
        print(f"Cleaning complete. Final shape: {df.shape}")
        return df
