package com.campusconnect.studentclient.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.campusconnect.studentclient.R
import com.campusconnect.studentclient.model.Student

class StudentAdapter(
    private var students: List<Student> = emptyList(),
    private val onItemClick: ((Student) -> Unit)? = null
) : RecyclerView.Adapter<StudentAdapter.StudentViewHolder>() {

    fun updateList(newStudents: List<Student>) {
        this.students = newStudents
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StudentViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_student, parent, false)
        return StudentViewHolder(view)
    }

    override fun onBindViewHolder(holder: StudentViewHolder, position: Int) {
        holder.bind(students[position])
    }

    override fun getItemCount(): Int = students.size

    inner class StudentViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvName: TextView = itemView.findViewById(R.id.tvStudentName)
        private val tvEmail: TextView = itemView.findViewById(R.id.tvStudentEmail)
        private val tvCourse: TextView = itemView.findViewById(R.id.tvStudentCourse)
        private val tvSemester: TextView = itemView.findViewById(R.id.tvStudentSemester)
        private val tvId: TextView = itemView.findViewById(R.id.tvStudentId)

        fun bind(student: Student) {
            tvName.text = student.name
            tvEmail.text = student.email
            tvCourse.text = student.course
            tvSemester.text = "Semester ${student.semester}"
            tvId.text = "#${student.id ?: "-"}"

            itemView.setOnClickListener { onItemClick?.invoke(student) }
        }
    }
}
