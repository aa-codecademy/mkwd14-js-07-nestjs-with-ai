import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

@ApiTags('classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new class' })
  @ApiCreatedResponse({
    description: 'Class created successfully',
    type: CreateClassDto,
    example: {
      _id: '507f1f77bcf86cd799439011',
      name: 'JavaScript Advanced',
      description: 'Advanced JavaScript concepts and best practices',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or missing required fields',
  })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all classes' })
  @ApiOkResponse({
    description: 'List of all classes retrieved successfully',
    example: [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'JavaScript Advanced',
        description: 'Advanced JavaScript concepts and best practices',
      },
    ],
  })
  findAll() {
    return this.classesService.findAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a class by ID' })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the class',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Class deleted successfully',
    example: {
      _id: '507f1f77bcf86cd799439011',
      name: 'JavaScript Advanced',
      description: 'Advanced JavaScript concepts and best practices',
    },
  })
  async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    await this.classesService.remove(id);
  }
}
