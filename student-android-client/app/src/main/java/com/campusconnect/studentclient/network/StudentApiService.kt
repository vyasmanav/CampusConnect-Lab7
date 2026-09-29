package com.campusconnect.studentclient.network

import com.campusconnect.studentclient.model.Student
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface StudentApiService {

    @GET("students")
    fun getAllStudents(): Call<List<Student>>

    @GET("students/{id}")
    fun getStudentById(@Path("id") id: String): Call<Student>

    @POST("students")
    fun createStudent(@Body student: Student): Call<Student>
}
