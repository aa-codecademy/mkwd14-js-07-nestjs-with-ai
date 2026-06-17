import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { TrimStringPipe } from '../common/pipes/trim-string.pipe';

// @ApiTags groups all routes in this controller under a 'Students' section in Swagger UI.
// @Controller('students') sets the base path — all routes here start with /api/students.
@ApiTags('Students')
@Controller('students')
export class StudentsController {
  // NestJS injects StudentsService automatically via the constructor (Dependency Injection).
  // The 'private readonly' shorthand declares and assigns the property in one step.
  constructor(private readonly studentsService: StudentsService) {}

  // @Post() maps this handler to POST /api/students.
  // @Body() extracts the JSON request body and transforms it into a CreateStudentDto
  // instance — class-validator then runs all the @Is* decorators on that DTO.
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

  // @Get() with no argument maps to GET /api/students — returns all students.
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

  @Get('search')
  @ApiQuery({
    name: 'name',
    description: 'Partial first or last name searching (whitespace is trimmed)',
    example: '   Ana    ', // > 'Ana'
  })
  search(@Query('name', TrimStringPipe) name: string) {
    return this.studentsService.search(name);
  }

  // @Get(':id') maps to GET /api/students/:id — the :id segment is a route parameter.
  // @Param('id', ParseObjectIdPipe) extracts the :id string from the URL and passes it
  // through ParseObjectIdPipe first — the pipe throws 400 if it isn't a valid ObjectId.
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

  // @Delete(':id') maps to DELETE /api/students/:id.
  // ParseObjectIdPipe validates the id before the handler runs — invalid ids never
  // reach the service or database.
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
