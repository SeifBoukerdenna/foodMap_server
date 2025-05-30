import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js';

export interface PlaceSearchRequest {
  query: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  type?: string;
}

export interface PlaceDetailsRequest {
  placeId: string;
}

export interface DirectionsRequest {
  origin: string;
  destination: string;
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
}

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);
  private readonly client: Client;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('googleMaps.apiKey') ||
      'AIzaSyAGYja99JlU03V-l3HJa281SEIdC_F-96Y';
    this.client = new Client({});

    if (!this.apiKey) {
      this.logger.warn('Google Maps API key not configured');
    }
  }

  async searchPlaces(request: PlaceSearchRequest) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await this.client.textSearch({
        params: {
          query: request.query,
          location:
            request.latitude && request.longitude
              ? { lat: request.latitude, lng: request.longitude }
              : undefined,
          radius: request.radius || 5000,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          type: request.type as any,
          key: this.apiKey,
        },
      });

      return {
        results: response.data.results.map((place) => ({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          rating: place.rating,
          priceLevel: place.price_level,
          photos:
            place.photos?.map((photo) => ({
              photoReference: photo.photo_reference,
              width: photo.width,
              height: photo.height,
            })) || [],
          geometry: {
            location: {
              lat: place.geometry?.location.lat,
              lng: place.geometry?.location.lng,
            },
          },
          types: place.types,
          openingHours: place.opening_hours,
        })),
        status: response.data.status,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error searching places: ${error.message}`);
      throw error;
    }
  }

  async getPlaceDetails(request: PlaceDetailsRequest) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: request.placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'price_level',
            'photos',
            'opening_hours',
            'formatted_phone_number',
            'website',
            'reviews',
            'types',
          ],
          key: this.apiKey,
        },
      });

      const place = response.data.result;
      return {
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        priceLevel: place.price_level,
        phoneNumber: place.formatted_phone_number,
        website: place.website,
        photos:
          place.photos?.map((photo) => ({
            photoReference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
          })) || [],
        geometry: {
          location: {
            lat: place.geometry?.location.lat,
            lng: place.geometry?.location.lng,
          },
        },
        openingHours: place.opening_hours,
        reviews:
          place.reviews?.slice(0, 5).map((review) => ({
            authorName: review.author_name,
            rating: review.rating,
            text: review.text,
            time: review.time,
          })) || [],
        types: place.types,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error getting place details: ${error.message}`);
      throw error;
    }
  }

  async getDirections(request: DirectionsRequest) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await this.client.directions({
        params: {
          origin: request.origin,
          destination: request.destination,
          mode: (request.mode ||
            'driving') as import('@googlemaps/google-maps-services-js').TravelMode,
          key: this.apiKey,
        },
      });

      console.log(
        '🔍 Raw Google API response:',
        JSON.stringify(response.data, null, 2),
      );

      return {
        routes: response.data.routes.map((route) => ({
          legs: route.legs.map((leg) => ({
            distance: leg.distance,
            duration: leg.duration,
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            steps: leg.steps.map((step) => ({
              distance: step.distance,
              duration: step.duration,
              instructions: step.html_instructions,
              startLocation: step.start_location,
              endLocation: step.end_location,
            })),
          })),
          overviewPolyline: route.overview_polyline.points,
          summary: route.summary,
        })),
        status: response.data.status,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error getting directions: ${error.message}`);
      throw error;
    }
  }

  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    if (!this.apiKey || !photoReference) {
      return '';
    }

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }
}
