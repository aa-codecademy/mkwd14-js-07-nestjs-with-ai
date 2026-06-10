import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({
    status: 201,
    description: 'Student created successfully',
    example: {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1234567890',
    },
  })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all students' })
  @ApiResponse({
    status: 200,
    description: 'List of all students',
    example: [
      {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
      },
    ],
  })
  findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a student by ID' })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the student',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Student found',
    example: {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1234567890',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.studentsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student by ID' })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the student',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Student deleted successfully',
  })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.studentsService.remove(id);
  }
}
