import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Public()
  @Post('public')
  @ApiOperation({ summary: 'Submit a public review' })
  async createPublic(@Body() body: any) {
    if (!body.tenantId || !body.content || !body.authorName) {
      throw new HttpException('Faltan campos requeridos', HttpStatus.BAD_REQUEST);
    }
    return this.reviewsService.create(body);
  }

  @Public()
  @Get('published/:tenantId')
  @ApiOperation({ summary: 'Get published reviews for a tenant (public)' })
  async findPublished(@Param('tenantId') tenantId: string, @Query('siteId') siteId?: string) {
    return this.reviewsService.findPublished(tenantId, siteId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'List tenant reviews' })
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '30', 10) || 30));
    return this.reviewsService.findAll(user.tenantId, p, l);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/publish')
  @ApiOperation({ summary: 'Toggle publish status' })
  async togglePublish(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('isPublished') isPublished: boolean
  ) {
    return this.reviewsService.updateStatus(id, user.tenantId, isPublished);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reviewsService.remove(id, user.tenantId);
  }
}
