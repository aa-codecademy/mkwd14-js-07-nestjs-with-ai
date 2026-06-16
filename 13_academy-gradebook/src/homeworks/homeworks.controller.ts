import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { HomeworksService } from './homeworks.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import type { Types } from 'mongoose';

@ApiTags('homeworks')
@Controller('homeworks')
export class HomeworksController {
  constructor(private readonly homeworksService: HomeworksService) {}

  // POST /api/homeworks — the service validates the referenced class exists before saving.
  // If the class is not found, a 404 is returned automatically via NotFoundException.
  @Post()
  @ApiOperation({ summary: 'Create a new homework assignment' })
  @ApiCreatedResponse({
    description: 'Homework assignment created successfully',
    example: {
      _id: '507f1f77bcf86cd799439011',
      title: 'TypeScript Basics Assignment',
      description: 'Complete exercises 1-5 in the TypeScript handbook',
      class: '507f1f77bcf86cd799439012',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
  })
  @ApiNotFoundResponse({
    description: 'Class has not been found',
  })
  create(@Body() createHomeworkDto: CreateHomeworkDto) {
    return this.homeworksService.create(createHomeworkDto);
  }

  // GET /api/homeworks — returns all homeworks sorted newest-first,
  // with the class reference populated (name + description instead of raw ObjectId).
  @Get()
  @ApiOperation({ summary: 'Retrieve all homework assignments' })
  @ApiOkResponse({
    description: 'List of all homework assignments retrieved successfully',
    example: [
      {
        _id: '507f1f77bcf86cd799439011',
        title: 'TypeScript Basics Assignment',
        description: 'Complete exercises 1-5 in the TypeScript handbook',
        class: '507f1f77bcf86cd799439012',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    ],
  })
  findAll() {
    return this.homeworksService.findAll();
  }

  // GET /api/homeworks/class/:id — a "sub-resource" route that returns only the homeworks
  // belonging to a specific class. Note: this route must be declared BEFORE @Get(':id')
  // (if that existed) to prevent NestJS from mistakenly matching 'class' as an :id value.
  // ParseObjectIdPipe coerces the string to a Types.ObjectId before passing it to the service.
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the class',
    example: '507f1f77bcf86cd799439011',
  })
  @Get('class/:id')
  findByClass(@Param('id', ParseObjectIdPipe) classId: Types.ObjectId) {
    return this.homeworksService.findByClass(classId);
  }

  // @HttpCode(HttpStatus.NO_CONTENT) overrides the default 200 status with 204.
  // 204 No Content is the correct HTTP response for a successful DELETE — it signals
  // the operation succeeded but there is no body to return.
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a homework assignment by ID' })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the homework assignment',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiNoContentResponse({
    description: 'Homework assignment deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Homework assignment not found',
  })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.homeworksService.remove(id);
  }
}
