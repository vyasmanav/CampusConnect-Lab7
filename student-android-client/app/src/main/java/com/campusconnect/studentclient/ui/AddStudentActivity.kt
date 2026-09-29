package com.campusconnect.studentclient.ui

import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.campusconnect.studentclient.R
import com.campusconnect.studentclient.model.ErrorResponse
import com.campusconnect.studentclient.model.Student
import com.campusconnect.studentclient.network.RetrofitClient
import com.google.gson.Gson
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class AddStudentActivity : AppCompatActivity() {

    private lateinit var etName: EditText
    private lateinit var etEmail: EditText
    private lateinit var etCourse: EditText
    private lateinit var etSemester: EditText
    private lateinit var btnSubmit: Button
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_student)

        title = "Add New Student"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        etName = findViewById(R.id.etName)
        etEmail = findViewById(R.id.etEmail)
        etCourse = findViewById(R.id.etCourse)
        etSemester = findViewById(R.id.etSemester)
        btnSubmit = findViewById(R.id.btnSubmit)
        progressBar = findViewById(R.id.progressBarAdd)

        btnSubmit.setOnClickListener {
            validateAndSubmit()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private fun validateAndSubmit() {
        val name = etName.text.toString().trim()
        val email = etEmail.text.toString().trim()
        val course = etCourse.text.toString().trim()
        val semesterStr = etSemester.text.toString().trim()

        if (name.isEmpty()) {
            etName.error = "Name is required"
            return
        }

        if (email.isEmpty() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            etEmail.error = "Valid email is required"
            return
        }

        if (course.isEmpty()) {
            etCourse.error = "Course is required"
            return
        }

        val semester = semesterStr.toIntOrNull()
        if (semester == null || semester < 1 || semester > 8) {
            etSemester.error = "Semester must be between 1 and 8"
            return
        }

        val student = Student(
            name = name,
            email = email,
            course = course,
            semester = semester
        )

        progressBar.visibility = View.VISIBLE
        btnSubmit.isEnabled = false

        RetrofitClient.apiService.createStudent(student).enqueue(object : Callback<Student> {
            override fun onResponse(call: Call<Student>, response: Response<Student>) {
                progressBar.visibility = View.GONE
                btnSubmit.isEnabled = true

                if (response.isSuccessful) {
                    Toast.makeText(
                        this@AddStudentActivity,
                        "Student Created Successfully (201 Created)",
                        Toast.LENGTH_SHORT
                    ).show()
                    finish()
                } else if (response.code() == 400) {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = try {
                        val parsed = Gson().fromJson(errorBody, ErrorResponse::class.java)
                        parsed.details?.joinToString(", ") ?: parsed.message ?: "Invalid student data"
                    } catch (e: Exception) {
                        "Validation error: 400 Bad Request"
                    }
                    Toast.makeText(this@AddStudentActivity, errorMsg, Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(
                        this@AddStudentActivity,
                        "Error: HTTP ${response.code()}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }

            override fun onFailure(call: Call<Student>, t: Throwable) {
                progressBar.visibility = View.GONE
                btnSubmit.isEnabled = true
                Toast.makeText(
                    this@AddStudentActivity,
                    "Something went wrong: ${t.localizedMessage}",
                    Toast.LENGTH_LONG
                ).show()
            }
        })
    }
}
