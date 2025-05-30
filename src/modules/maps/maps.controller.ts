// src/modules/maps/maps.controller.ts

import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import {
  MapsService,
  PlaceSearchRequest,
  PlaceDetailsRequest,
  DirectionsRequest,
} from './maps.service';
import { SimpleAuthGuard } from '../auth/gards/auth.guard';
import { AppCheckGuard } from '../app-check/app-check.guard';

@ApiTags('maps')
@Controller('maps')
@UseGuards(SimpleAuthGuard, AppCheckGuard)
export class MapsController {
  private readonly logger = new Logger(MapsController.name);

  constructor(private readonly mapsService: MapsService) {}

  @Post('search')
  @ApiOperation({ summary: 'Search for places using Google Places API' })
  @ApiResponse({
    status: 200,
    description: 'Places search results',
  })
  async searchPlaces(@Body() request: PlaceSearchRequest) {
    this.logger.log(`🔍 Received search request: ${JSON.stringify(request)}`);

    try {
      const result = await this.mapsService.searchPlaces(request);
      this.logger.log(
        `✅ Search completed: Found ${result.results.length} places`,
      );
      return result;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`❌ Search failed: ${error.message}`);
      throw error;
    }
  }

  @Post('place-details')
  @ApiOperation({ summary: 'Get detailed information about a place' })
  @ApiResponse({
    status: 200,
    description: 'Place details',
  })
  async getPlaceDetails(@Body() request: PlaceDetailsRequest) {
    this.logger.log(`📍 Getting place details for: ${request.placeId}`);
    return this.mapsService.getPlaceDetails(request);
  }

  @Post('directions')
  @ApiOperation({ summary: 'Get directions between two locations' })
  @ApiResponse({
    status: 200,
    description: 'Directions',
  })
  async getDirections(@Body() request: DirectionsRequest) {
    this.logger.log(
      `🗺️ Getting directions from ${request.origin} to ${request.destination}`,
    );
    return this.mapsService.getDirections(request);
  }

  @Get('photo')
  @ApiOperation({ summary: 'Get photo URL for a place' })
  @ApiQuery({ name: 'photoReference', required: true })
  @ApiQuery({ name: 'maxWidth', required: false })
  @ApiResponse({
    status: 200,
    description: 'Photo URL',
  })
  getPhotoUrl(
    @Query('photoReference') photoReference: string,
    @Query('maxWidth') maxWidth?: number,
  ) {
    return {
      url: this.mapsService.getPhotoUrl(photoReference, maxWidth),
    };
  }
}
