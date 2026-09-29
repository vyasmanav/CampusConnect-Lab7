package com.campusconnect.studentclient.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.campusconnect.studentclient.R
import com.campusconnect.studentclient.adapter.StudentAdapter
import com.campusconnect.studentclient.model.Student
import com.campusconnect.studentclient.network.RetrofitClient
import com.google.android.material.floatingactionbutton.FloatingActionButton
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class MainActivity : AppCompatActivity() {

    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var recyclerView: RecyclerView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvEmpty: TextView
    private lateinit var fabAdd: FloatingActionButton
    private lateinit var adapter: StudentAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        title = "CampusConnect Students"

        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        recyclerView = findViewById(R.id.recyclerViewStudents)
        progressBar = findViewById(R.id.progressBar)
        tvEmpty = findViewById(R.id.tvEmptyState)
        fabAdd = findViewById(R.id.fabAddStudent)

        adapter = StudentAdapter { student ->
            Toast.makeText(this, "Student: ${student.name} (#${student.id})", Toast.LENGTH_SHORT).show()
        }

        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        swipeRefreshLayout.setOnRefreshListener {
            loadStudents(isSwipe = true)
        }

        fabAdd.setOnClickListener {
            val intent = Intent(this, AddStudentActivity::class.java)
            startActivity(intent)
        }

        loadStudents(isSwipe = false)
    }

    override fun onResume() {
        super.onResume()
        loadStudents(isSwipe = true)
    }

    private fun loadStudents(isSwipe: Boolean) {
        if (!isSwipe) progressBar.visibility = View.VISIBLE
        tvEmpty.visibility = View.GONE

        RetrofitClient.apiService.getAllStudents().enqueue(object : Callback<List<Student>> {
            override fun onResponse(call: Call<List<Student>>, response: Response<List<Student>>) {
                progressBar.visibility = View.GONE
                swipeRefreshLayout.isRefreshing = false

                if (response.isSuccessful) {
                    val list = response.body() ?: emptyList()
                    adapter.updateList(list)
                    tvEmpty.visibility = if (list.isEmpty()) View.VISIBLE else View.GONE
                } else if (response.code() == 404) {
                    Toast.makeText(this@MainActivity, "Student not found", Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(this@MainActivity, "Server Error: HTTP ${response.code()}", Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<List<Student>>, t: Throwable) {
                progressBar.visibility = View.GONE
                swipeRefreshLayout.isRefreshing = false
                Toast.makeText(this@MainActivity, "Something went wrong: ${t.localizedMessage}", Toast.LENGTH_LONG).show()
                tvEmpty.text = "Unable to connect to REST API.\nEnsure backend is running at ${RetrofitClient.API_BASE_URL}"
                tvEmpty.visibility = View.VISIBLE
            }
        })
    }
}
