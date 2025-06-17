// Student Management System - Core JavaScript

class StudentManager {
    constructor() {
        this.students = [];
        this.editingStudentId = null;
        this.init();
    }

    init() {
        this.loadStudents();
        this.bindEvents();
        this.renderStudents();
        this.updateStats();
        this.updateFilters();
    }

    // Local Storage Operations
    loadStudents() {
        const stored = localStorage.getItem('students_data');
        if (stored) {
            try {
                this.students = JSON.parse(stored).map(student => ({
                    ...student,
                    createdAt: new Date(student.createdAt),
                    updatedAt: new Date(student.updatedAt)
                }));
            } catch (error) {
                console.error('Error loading students:', error);
                this.students = [];
            }
        }
    }

    saveStudents() {
        try {
            localStorage.setItem('students_data', JSON.stringify(this.students));
        } catch (error) {
            console.error('Error saving students:', error);
        }
    }

    // CRUD Operations
    addStudent(studentData) {
        const newStudent = {
            ...studentData,
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.students.push(newStudent);
        this.saveStudents();
        return newStudent;
    }

    updateStudent(id, studentData) {
        const index = this.students.findIndex(student => student.id === id);
        if (index === -1) {
            throw new Error('Student not found');
        }
        
        this.students[index] = {
            ...this.students[index],
            ...studentData,
            updatedAt: new Date()
        };
        
        this.saveStudents();
        return this.students[index];
    }

    deleteStudent(id) {
        const index = this.students.findIndex(student => student.id === id);
        if (index === -1) {
            throw new Error('Student not found');
        }
        
        this.students.splice(index, 1);
        this.saveStudents();
    }

    generateId() {
        return 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Filtering and Search
    getFilteredStudents() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const departmentFilter = document.getElementById('departmentFilter').value;
        const yearFilter = document.getElementById('yearFilter').value;

        return this.students.filter(student => {
            const matchesSearch = !searchTerm || 
                student.name.toLowerCase().includes(searchTerm) ||
                student.regNo.toLowerCase().includes(searchTerm);
            
            const matchesDepartment = !departmentFilter || student.department === departmentFilter;
            const matchesYear = !yearFilter || student.year === yearFilter;
            
            return matchesSearch && matchesDepartment && matchesYear;
        });
    }

    // UI Rendering
    renderStudents() {
        const filteredStudents = this.getFilteredStudents();
        const tbody = document.getElementById('studentTableBody');
        const emptyState = document.getElementById('emptyState');
        const noDataState = document.getElementById('noDataState');
        const tableContainer = document.querySelector('.table-responsive');

        if (this.students.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'none';
            noDataState.style.display = 'block';
            return;
        }

        if (filteredStudents.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            noDataState.style.display = 'none';
            return;
        }

        tableContainer.style.display = 'block';
        emptyState.style.display = 'none';
        noDataState.style.display = 'none';

        tbody.innerHTML = filteredStudents.map(student => `
            <tr>
                <td>${this.escapeHtml(student.name)}</td>
                <td>${this.escapeHtml(student.regNo)}</td>
                <td>${this.escapeHtml(student.department)}</td>
                <td>${this.escapeHtml(student.year)}</td>
                <td>${student.marks || '-'}</td>
                <td>${student.cgpa || '-'}</td>
                <td>
                    <button class="btn btn-action btn-edit" onclick="studentManager.editStudent('${student.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-action btn-delete" onclick="studentManager.confirmDelete('${student.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        const totalStudents = this.students.length;
        const departments = [...new Set(this.students.map(s => s.department))].length;
        const years = [...new Set(this.students.map(s => s.year))].length;
        
        const cgpaValues = this.students
            .map(s => s.cgpa)
            .filter(cgpa => cgpa != null && cgpa !== '');
        
        const avgCgpa = cgpaValues.length > 0 
            ? (cgpaValues.reduce((sum, cgpa) => sum + parseFloat(cgpa), 0) / cgpaValues.length).toFixed(1)
            : '0.0';

        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('totalDepartments').textContent = departments;
        document.getElementById('totalYears').textContent = years;
        document.getElementById('avgCgpa').textContent = avgCgpa;
    }

    updateFilters() {
        const departments = [...new Set(this.students.map(s => s.department))].sort();
        const years = [...new Set(this.students.map(s => s.year))].sort();

        const departmentSelect = document.getElementById('departmentFilter');
        const yearSelect = document.getElementById('yearFilter');

        // Preserve current selections
        const currentDept = departmentSelect.value;
        const currentYear = yearSelect.value;

        // Update department filter
        departmentSelect.innerHTML = '<option value="">All Departments</option>' +
            departments.map(dept => `<option value="${this.escapeHtml(dept)}">${this.escapeHtml(dept)}</option>`).join('');
        departmentSelect.value = currentDept;

        // Update year filter
        yearSelect.innerHTML = '<option value="">All Years</option>' +
            years.map(year => `<option value="${this.escapeHtml(year)}">${this.escapeHtml(year)}</option>`).join('');
        yearSelect.value = currentYear;
    }

    // Form Operations
    openAddForm() {
        this.editingStudentId = null;
        document.getElementById('modalTitle').textContent = 'Add New Student';
        document.getElementById('studentForm').reset();
        
        const modal = new bootstrap.Modal(document.getElementById('studentModal'));
        modal.show();
    }

    editStudent(id) {
        const student = this.students.find(s => s.id === id);
        if (!student) return;

        this.editingStudentId = id;
        document.getElementById('modalTitle').textContent = 'Edit Student';
        
        // Populate form
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentRegNo').value = student.regNo;
        document.getElementById('studentDepartment').value = student.department;
        document.getElementById('studentYear').value = student.year;
        document.getElementById('studentMarks').value = student.marks || '';
        document.getElementById('studentCgpa').value = student.cgpa || '';
        
        const modal = new bootstrap.Modal(document.getElementById('studentModal'));
        modal.show();
    }

    saveStudent() {
        const form = document.getElementById('studentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const studentData = {
            name: document.getElementById('studentName').value.trim(),
            regNo: document.getElementById('studentRegNo').value.trim(),
            department: document.getElementById('studentDepartment').value.trim(),
            year: document.getElementById('studentYear').value,
            marks: document.getElementById('studentMarks').value ? 
                   parseInt(document.getElementById('studentMarks').value) : null,
            cgpa: document.getElementById('studentCgpa').value ? 
                  parseFloat(document.getElementById('studentCgpa').value) : null
        };

        try {
            if (this.editingStudentId) {
                this.updateStudent(this.editingStudentId, studentData);
            } else {
                this.addStudent(studentData);
            }

            this.renderStudents();
            this.updateStats();
            this.updateFilters();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('studentModal'));
            modal.hide();
            
            this.showToast(this.editingStudentId ? 'Student updated successfully!' : 'Student added successfully!');
        } catch (error) {
            console.error('Error saving student:', error);
            this.showToast('Error saving student. Please try again.', 'error');
        }
    }

    confirmDelete(id) {
        const student = this.students.find(s => s.id === id);
        if (!student) return;

        if (confirm(`Are you sure you want to delete ${student.name}?`)) {
            try {
                this.deleteStudent(id);
                this.renderStudents();
                this.updateStats();
                this.updateFilters();
                this.showToast('Student deleted successfully!');
            } catch (error) {
                console.error('Error deleting student:', error);
                this.showToast('Error deleting student. Please try again.', 'error');
            }
        }
    }

    // Event Binding
    bindEvents() {
        // Search and filter events
        document.getElementById('searchInput').addEventListener('input', () => {
            this.renderStudents();
        });

        document.getElementById('departmentFilter').addEventListener('change', () => {
            this.renderStudents();
        });

        document.getElementById('yearFilter').addEventListener('change', () => {
            this.renderStudents();
        });

        // Form events
        document.getElementById('saveStudentBtn').addEventListener('click', () => {
            this.saveStudent();
        });

        // Modal events
        document.getElementById('studentModal').addEventListener('hidden.bs.modal', () => {
            this.editingStudentId = null;
        });

        // Form submission on Enter
        document.getElementById('studentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveStudent();
        });
    }

    // Utilities
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : 'success'} position-fixed`;
        toast.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the application
const studentManager = new StudentManager();

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);