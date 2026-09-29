package com.campusconnect.studentclient.model

import com.google.gson.annotations.SerializedName

data class Student(
    @SerializedName("id")
    val id: String? = null,

    @SerializedName("name")
    val name: String,

    @SerializedName("email")
    val email: String,

    @SerializedName("course")
    val course: String,

    @SerializedName("semester")
    val semester: Int
)

data class ErrorResponse(
    @SerializedName("timestamp")
    val timestamp: String? = null,

    @SerializedName("status")
    val status: Int? = null,

    @SerializedName("error")
    val error: String? = null,

    @SerializedName("message")
    val message: String? = null,

    @SerializedName("details")
    val details: List<String>? = null
)
