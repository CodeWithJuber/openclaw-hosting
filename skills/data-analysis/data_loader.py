"""
Data Loader Module

Handles loading data from various file formats and sources.
"""

import pandas as pd
import json
from pathlib import Path
from glob import glob
from typing import Union, List, Optional


class DataLoader:
    """Load data from various file formats."""
    
    def __init__(self, config=None):
        self.config = config or {}
        self.encoding = self.config.get('encoding', 'utf-8')
    
    def load_csv(self, path: Union[str, Path], **kwargs) -> pd.DataFrame:
        """
        Load CSV file.
        
        Args:
            path: Path to CSV file
            encoding: File encoding (default: utf-8)
            parse_dates: List of columns to parse as dates
            dtype: Dictionary of column types
            **kwargs: Additional pandas read_csv options
            
        Returns:
            pandas.DataFrame
        """
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        
        options = {
            'encoding': kwargs.pop('encoding', self.encoding),
        }
        
        if 'parse_dates' in kwargs:
            options['parse_dates'] = kwargs.pop('parse_dates')
        if 'dtype' in kwargs:
            options['dtype'] = kwargs.pop('dtype')
        
        options.update(kwargs)
        
        return pd.read_csv(path, **options)
    
    def load_excel(self, path: Union[str, Path], **kwargs) -> pd.DataFrame:
        """
        Load Excel file.
        
        Args:
            path: Path to Excel file
            sheet_name: Sheet name or index (default: 0)
            header: Row to use as header (default: 0)
            **kwargs: Additional pandas read_excel options
            
        Returns:
            pandas.DataFrame
        """
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        
        options = {
            'sheet_name': kwargs.pop('sheet_name', 0),
            'header': kwargs.pop('header', 0),
        }
        
        if 'parse_dates' in kwargs:
            options['parse_dates'] = kwargs.pop('parse_dates')
        
        options.update(kwargs)
        
        return pd.read_excel(path, **options)
    
    def load_json(self, path: Union[str, Path], **kwargs) -> pd.DataFrame:
        """
        Load JSON file.
        
        Args:
            path: Path to JSON file
            orient: JSON structure format (default: 'records')
            lines: Whether JSON is line-delimited (default: False)
            **kwargs: Additional pandas read_json options
            
        Returns:
            pandas.DataFrame
        """
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        
        options = {
            'orient': kwargs.pop('orient', 'records'),
        }
        
        if 'lines' in kwargs:
            options['lines'] = kwargs.pop('lines')
        
        options.update(kwargs)
        
        with open(path, 'r', encoding=self.encoding) as f:
            if options.get('lines'):
                data = [json.loads(line) for line in f]
                return pd.DataFrame(data)
            else:
                return pd.read_json(path, **options)
    
    def load_multiple(self, pattern: str, concat: bool = True, **kwargs) -> Union[pd.DataFrame, List[pd.DataFrame]]:
        """
        Load multiple files matching a glob pattern.
        
        Args:
            pattern: Glob pattern (e.g., "data/*.csv")
            concat: Whether to concatenate files (default: True)
            **kwargs: Options for load_csv
            
        Returns:
            pandas.DataFrame if concat=True, else list of DataFrames
        """
        files = glob(pattern)
        if not files:
            raise FileNotFoundError(f"No files found matching pattern: {pattern}")
        
        dataframes = []
        for file in sorted(files):
            if file.endswith('.csv'):
                df = self.load_csv(file, **kwargs)
            elif file.endswith(('.xlsx', '.xls')):
                df = self.load_excel(file, **kwargs)
            elif file.endswith('.json'):
                df = self.load_json(file, **kwargs)
            else:
                continue
            
            df['__source_file'] = Path(file).name
            dataframes.append(df)
        
        if concat:
            return pd.concat(dataframes, ignore_index=True)
        return dataframes
    
    def load_from_string(self, data: str, format: str = 'csv', **kwargs) -> pd.DataFrame:
        """
        Load data from a string.
        
        Args:
            data: String containing data
            format: Format type ('csv', 'json')
            **kwargs: Format-specific options
            
        Returns:
            pandas.DataFrame
        """
        if format == 'csv':
            from io import StringIO
            return pd.read_csv(StringIO(data), **kwargs)
        elif format == 'json':
            return pd.read_json(data, **kwargs)
        else:
            raise ValueError(f"Unsupported format: {format}")
