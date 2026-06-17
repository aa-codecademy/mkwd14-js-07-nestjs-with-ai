import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import type { Types } from 'mongoose';

@ApiTags('grades')
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  // POST /api/grades — validates student + homework exist, prevents duplicate grades,
  // then creates the grade and returns it with student and homework populated.
  @Post()
  @ApiCreatedResponse({ description: 'Grade created successfully' })
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradesService.create(createGradeDto);
  }

  // GET /api/grades — returns all grades with student and homework details populated.
  @Get()
  @ApiOkResponse({ description: 'Return all grades' })
  findAll() {
    return this.gradesService.findAll();
  }

  // --- STUDENT EXERCISES ---
  // The three handlers below are intentionally left empty.
  // Your task is to implement them in GradesService and wire them up here.

  // GET /api/grades/student/:id — return all grades for a given student.
  // Hint: filter gradeModel by { student: id } and populate 'homework'.
  @Get('student/:id')
  @ApiOperation({ summary: 'Retrieve grades for a student' })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the student',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @ApiOkResponse({ description: 'Return grades for a student' })
  findByStudent(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.gradesService.findByStudent(id);
  }

  // GET /api/grades/homework/:id — return all grades for a given homework.
  // Hint: filter gradeModel by { homework: id } and populate 'student'.
  @Get('homework/:id')
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the homework',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @ApiOkResponse({ description: 'Return grades for a homework' })
  findByHomework(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.gradesService.findByHomework(id);
  }

  // GET /api/grades/student/:id/average — return the average grade value for a student.
  // Hint: use MongoDB aggregation ($match + $group with $avg) or fetch all grades and
  // calculate the average in JavaScript using Array.reduce().
  @Get('student/:id/average')
  @ApiOkResponse({ description: 'Return average grade for a student' })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the student',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  averageForStudent(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.gradesService.averageForStudent(id);
  }

  // DELETE /api/grades/:id — the +id converts the string param to a number.
  // NOTE: This is a placeholder — the service currently returns a string.
  // Exercise: implement real deletion using gradeModel.findByIdAndDelete(id).
  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.gradesService.remove(id);
  }
}
