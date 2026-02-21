import { api } from '@/lib/axios';

/** Request body for POST /properties/predict-price */
export interface PredictPriceRequest {
  type: 'HOUSE' | 'APARTMENT';
  location: string;
  area: number;
  rooms: number;
  floor?: number;
  description?: string;
  imageBase64?: string[];
  propertyId?: number;
}

/** Response from POST /properties/predict-price */
export interface PredictPriceResponse {
  estimatedPrice: number;
  reasoning?: string;
  source?: string;
}

/** Response from GET /properties/prediction-status */
export interface PredictionStatusResponse {
  available: boolean;
  textModel?: string;
  visionModel?: string;
  visionAvailable?: boolean;
  priceDataLoaded?: number;
}

/**
 * Get AI price estimate for a property.
 * Requires: type (HOUSE | APARTMENT), location, area, rooms.
 */
export async function predictPrice(
  body: PredictPriceRequest
): Promise<PredictPriceResponse> {
  const { data } = await api.post<PredictPriceResponse>(
    '/properties/predict-price',
    body
  );
  return data;
}

/**
 * Check if AI price prediction is available (optional, for UI hints).
 */
export async function getPredictionStatus(): Promise<PredictionStatusResponse> {
  const { data } = await api.get<PredictionStatusResponse>(
    '/properties/prediction-status'
  );
  return data;
}
