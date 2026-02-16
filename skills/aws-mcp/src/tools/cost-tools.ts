/**
 * Cost Explorer Tool Handlers
 */

import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostForecastCommand,
  GetUsageForecastCommand,
  GetReservationUtilizationCommand,
  GetCostAndUsageWithResourcesCommand,
  DescribeBudgetsCommand,
  CreateBudgetCommand
} from '@aws-sdk/client-cost-explorer';
import { AWSConfig, ToolResult, CostAndUsageOptions, Budget } from '../types';
import { CredentialManager } from '../credentials/manager';
import { convertAwsError } from '../errors';

export class CostTools {
  private client: CostExplorerClient;
  private credentialManager: CredentialManager;

  constructor(config: AWSConfig, credentialManager: CredentialManager) {
    this.credentialManager = credentialManager;
    this.client = new CostExplorerClient({
      region: config.region || 'us-east-1', // Cost Explorer is only available in us-east-1
      credentials: async () => this.credentialManager.getCredentialProvider()
    });
  }

  /**
   * Get cost and usage data
   */
  async getCostAndUsage(args: CostAndUsageOptions): Promise<ToolResult> {
    try {
      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: args.timePeriod.start,
          End: args.timePeriod.end
        },
        Granularity: args.granularity,
        Metrics: args.metrics,
        GroupBy: args.groupBy,
        Filter: args.filter
      });

      const response = await this.client.send(command);

      const resultsByTime = (response.ResultsByTime || []).map(result => ({
        timePeriod: {
          start: result.TimePeriod?.Start,
          end: result.TimePeriod?.End
        },
        total: result.Total ? Object.entries(result.Total).reduce((acc, [key, value]) => {
          acc[key] = {
            amount: value.Amount,
            unit: value.Unit
          };
          return acc;
        }, {} as any) : undefined,
        groups: result.Groups?.map(group => ({
          keys: group.Keys,
          metrics: group.Metrics ? Object.entries(group.Metrics).reduce((acc, [key, value]) => {
            acc[key] = {
              amount: value.Amount,
              unit: value.Unit
            };
            return acc;
          }, {} as any) : undefined
        })),
        estimated: result.Estimated
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            resultsByTime,
            dimensionValueAttributes: response.DimensionValueAttributes?.map(dva => ({
              value: dva.Value,
              attributes: dva.Attributes
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get cost by service
   */
  async getCostByService(args: {
    timePeriod: { start: string; end: string };
    granularity?: 'DAILY' | 'MONTHLY' | 'HOURLY';
  }): Promise<ToolResult> {
    try {
      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: args.timePeriod.start,
          End: args.timePeriod.end
        },
        Granularity: args.granularity || 'MONTHLY',
        Metrics: ['BlendedCost', 'UsageQuantity'],
        GroupBy: [
          { Type: 'DIMENSION', Key: 'SERVICE' }
        ]
      });

      const response = await this.client.send(command);

      const resultsByTime = (response.ResultsByTime || []).map(result => ({
        timePeriod: result.TimePeriod,
        groups: result.Groups?.map(group => ({
          service: group.Keys?.[0],
          blendedCost: {
            amount: group.Metrics?.BlendedCost?.Amount,
            unit: group.Metrics?.BlendedCost?.Unit
          },
          usageQuantity: {
            amount: group.Metrics?.UsageQuantity?.Amount,
            unit: group.Metrics?.UsageQuantity?.Unit
          }
        })).sort((a, b) => 
          parseFloat(b.blendedCost?.amount || '0') - parseFloat(a.blendedCost?.amount || '0')
        )
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ resultsByTime }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get cost by tag
   */
  async getCostByTag(args: {
    timePeriod: { start: string; end: string };
    tagKey: string;
    granularity?: 'DAILY' | 'MONTHLY' | 'HOURLY';
  }): Promise<ToolResult> {
    try {
      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: args.timePeriod.start,
          End: args.timePeriod.end
        },
        Granularity: args.granularity || 'MONTHLY',
        Metrics: ['BlendedCost'],
        GroupBy: [
          { Type: 'TAG', Key: args.tagKey }
        ]
      });

      const response = await this.client.send(command);

      const resultsByTime = (response.ResultsByTime || []).map(result => ({
        timePeriod: result.TimePeriod,
        groups: result.Groups?.map(group => ({
          tagValue: group.Keys?.[0]?.replace(`${args.tagKey}$`, ''),
          blendedCost: {
            amount: group.Metrics?.BlendedCost?.Amount,
            unit: group.Metrics?.BlendedCost?.Unit
          }
        })).sort((a, b) => 
          parseFloat(b.blendedCost?.amount || '0') - parseFloat(a.blendedCost?.amount || '0')
        )
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ resultsByTime }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get cost forecast
   */
  async getCostForecast(args: {
    timePeriod: { start: string; end: string };
    metric?: 'BLENDED_COST' | 'UNBLENDED_COST' | 'AMORTIZED_COST' | 'NET_UNBLENDED_COST' | 'NET_AMORTIZED_COST';
    granularity?: 'DAILY' | 'MONTHLY' | 'HOURLY';
    predictionIntervalLevel?: number;
  }): Promise<ToolResult> {
    try {
      const command = new GetCostForecastCommand({
        TimePeriod: {
          Start: args.timePeriod.start,
          End: args.timePeriod.end
        },
        Metric: args.metric || 'BLENDED_COST',
        Granularity: args.granularity || 'MONTHLY',
        PredictionIntervalLevel: args.predictionIntervalLevel
      });

      const response = await this.client.send(command);

      const forecastResultsByTime = (response.ForecastResultsByTime || []).map(result => ({
        timePeriod: result.TimePeriod,
        meanValue: result.MeanValue,
        predictionIntervalLowerBound: result.PredictionIntervalLowerBound,
        predictionIntervalUpperBound: result.PredictionIntervalUpperBound
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            total: {
              meanValue: response.Total?.Amount,
              unit: response.Total?.Unit
            },
            forecastResultsByTime
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get usage forecast
   */
  async getUsageForecast(args: {
    timePeriod: { start: string; end: string };
    metric: string;
    granularity?: 'DAILY' | 'MONTHLY' | 'HOURLY';
    predictionIntervalLevel?: number;
  }): Promise<ToolResult> {
    try {
      const command = new UsageForecastCommand({
        TimePeriod: {
          Start: args.timePeriod.start,
          End: args.timePeriod.end
        },
        Metric: args.metric,
        Granularity: args.granularity || 'MONTHLY',
        PredictionIntervalLevel: args.predictionIntervalLevel
      });

      const response = await this.client.send(command);

      const forecastResultsByTime = (response.ForecastResultsByTime || []).map(result => ({
        timePeriod: result.TimePeriod,
        meanValue: result.MeanValue,
        predictionIntervalLowerBound: result.PredictionIntervalLowerBound,
        predictionIntervalUpperBound: result.PredictionIntervalUpperBound
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            total: {
              meanValue: response.Total?.Amount,
              unit: response.Total?.Unit
            },
            forecastResultsByTime
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get reservation utilization
   */
  async getReservationUtilization(args: {
    timePeriod: { start: string; end: string };
    granularity?: 'DAILY' | 'MONTHLY';
    filter?: object;
  }): Promise<ToolResult> {
    try {
      const command = new GetReservationUtilizationCommand({
        TimePeriod: {
          Start: args.timePeriod.start,
          End: args.timePeriod.end
        },
        Granularity: args.granularity || 'MONTHLY',
        Filter: args.filter
      });

      const response = await this.client.send(command);

      const utilizationsByTime = (response.UtilizationsByTime || []).map(util => ({
        timePeriod: util.TimePeriod,
        groups: util.Groups?.map(group => ({
          key: group.Key,
          value: group.Value,
          attributes: group.Attributes
        })),
        total: util.Total ? {
          amortizedRecurringFee: util.Total.AmortizedRecurringFee,
          amortizedUpfrontFee: util.Total.AmortizedUpfrontFee,
          netRISavings: util.Total.NetRISavings,
          onDemandCostOfRIHoursUsed: util.Total.OnDemandCostOfRIHoursUsed,
          purchasedHours: util.Total.PurchasedHours,
          purchasedUnits: util.Total.PurchasedUnits,
          totalActualHours: util.Total.TotalActualHours,
          totalActualUnits: util.Total.TotalActualUnits,
          totalAmortizedFee: util.Total.TotalAmortizedFee,
          totalPotentialRISavings: util.Total.TotalPotentialRISavings,
          unusedHours: util.Total.UnusedHours,
          unusedUnits: util.Total.UnusedUnits,
          utilizationPercentage: util.Total.UtilizationPercentage
        } : undefined
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ utilizationsByTime }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List budgets
   */
  async getBudgets(args: {
    accountId?: string;
    maxResults?: number;
    nextToken?: string;
  } = {}): Promise<ToolResult> {
    try {
      const command = new DescribeBudgetsCommand({
        AccountId: args.accountId,
        MaxResults: args.maxResults,
        NextToken: args.nextToken
      });

      const response = await this.client.send(command);

      const budgets: Budget[] = (response.Budgets || []).map(budget => ({
        budgetName: budget.BudgetName || '',
        budgetLimit: {
          amount: budget.BudgetLimit?.Amount || '0',
          unit: budget.BudgetLimit?.Unit || 'USD'
        },
        timePeriod: {
          start: budget.TimePeriod?.Start,
          end: budget.TimePeriod?.End
        },
        budgetType: budget.BudgetType || '',
        calculatedSpend: budget.CalculatedSpend ? {
          actualSpend: {
            amount: budget.CalculatedSpend.ActualSpend?.Amount || '0',
            unit: budget.CalculatedSpend.ActualSpend?.Unit || 'USD'
          },
          forecastedSpend: budget.CalculatedSpend.ForecastedSpend ? {
            amount: budget.CalculatedSpend.ForecastedSpend.Amount || '0',
            unit: budget.CalculatedSpend.ForecastedSpend.Unit || 'USD'
          } : undefined
        } : undefined
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            budgets,
            nextToken: response.NextToken
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Create a budget
   */
  async createBudget(args: {
    budgetName: string;
    budgetLimit: { amount: string; unit: string };
    timePeriod: { start?: Date; end?: Date };
    budgetType?: string;
    costFilters?: object;
    costTypes?: object;
    notificationsWithSubscribers?: any[];
  }): Promise<ToolResult> {
    try {
      const command = new CreateBudgetCommand({
        Budget: {
          BudgetName: args.budgetName,
          BudgetLimit: {
            Amount: args.budgetLimit.amount,
            Unit: args.budgetLimit.unit
          },
          TimePeriod: {
            Start: args.timePeriod.start,
            End: args.timePeriod.end
          },
          BudgetType: args.budgetType || 'COST',
          CostFilters: args.costFilters,
          CostTypes: args.costTypes
        },
        NotificationsWithSubscribers: args.notificationsWithSubscribers
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Budget '${args.budgetName}' created successfully`,
            budgetName: args.budgetName,
            budgetLimit: args.budgetLimit,
            timePeriod: args.timePeriod
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get cost and usage with resource-level granularity
   */
  async getCostAndUsageWithResources(args: {
    timePeriod: { start: string; end: string };
    granularity?: 'DAILY' | 'MONTHLY';
    filter?: object;
    groupBy?: Array<{ type: string; key: string }>;
    nextPageToken?: string;
  }): Promise<ToolResult> {
    try {
      const command = new GetCostAndUsageWithResourcesCommand({
        TimePeriod: {
          Start: args.timePeriod.start,
          End: args.timePeriod.end
        },
        Granularity: args.granularity || 'DAILY',
        Metrics: ['BlendedCost', 'UsageQuantity'],
        Filter: args.filter,
        GroupBy: args.groupBy,
        NextPageToken: args.nextPageToken
      });

      const response = await this.client.send(command);

      const resultsByTime = (response.ResultsByTime || []).map(result => ({
        timePeriod: result.TimePeriod,
        groups: result.Groups?.map(group => ({
          keys: group.Keys,
          metrics: group.Metrics ? Object.entries(group.Metrics).reduce((acc, [key, value]) => {
            acc[key] = {
              amount: value.Amount,
              unit: value.Unit
            };
            return acc;
          }, {} as any) : undefined
        })),
        estimated: result.Estimated
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            resultsByTime,
            nextPageToken: response.NextPageToken
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }
}
