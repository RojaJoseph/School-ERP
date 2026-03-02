// ── User & Auth ───────────────────────────────────────
export type Role =
  | 'super_admin' | 'school_admin' | 'sub_admin'
  | 'teacher' | 'accountant' | 'hr_manager'
  | 'librarian' | 'transport_mgr' | 'student' | 'parent'

export interface User {
  id: number
  full_name: string
  email: string
  phone?: string
  role: Role
  is_active: boolean
  created_at: string
}

// ── Student ───────────────────────────────────────────
export interface Student {
  id: number
  admission_no: string
  roll_no?: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  blood_group?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  class_name: string
  section?: string
  academic_year: string
  guardian_name: string
  guardian_phone: string
  guardian_email?: string
  photo?: string
  is_active: boolean
  created_at: string
}

export interface StudentListResponse {
  total: number
  page: number
  per_page: number
  students: Student[]
}

// ── Attendance ────────────────────────────────────────
export interface AttendanceRecord {
  id: number
  student_id: number
  date: string
  status: 'present' | 'absent' | 'leave' | 'late'
  marked_by?: number
}

// ── Exam ──────────────────────────────────────────────
export interface Exam {
  id: number
  name: string
  exam_type: string
  class_name: string
  section?: string
  subject: string
  exam_date: string
  total_marks: number
  passing_marks: number
  academic_year: string
}

export interface ExamResult {
  id: number
  exam_id: number
  student_id: number
  marks?: number
  grade?: string
  is_absent: boolean
  remarks?: string
}

// ── Fee ───────────────────────────────────────────────
export interface FeeStructure {
  id: number
  name: string
  class_name: string
  academic_year: string
  amount: number
  due_date: string
}

export interface FeePayment {
  id: number
  student_id: number
  invoice_no: string
  amount: number
  paid_amount: number
  status: 'pending' | 'paid' | 'overdue' | 'partial' | 'waived'
  payment_method?: string
  due_date?: string
  paid_at?: string
}

// ── Employee / Payroll ────────────────────────────────
export interface Employee {
  id: number
  emp_code: string
  first_name: string
  last_name: string
  department?: string
  designation?: string
  employee_type: string
  salary: number
  phone?: string
  is_active: boolean
}

export interface Payroll {
  id: number
  employee_id: number
  month: number
  year: number
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  paid_at?: string
}

// ── Transport ─────────────────────────────────────────
export interface BusRoute {
  id: number
  route_name: string
  route_no: string
  driver_name?: string
  driver_phone?: string
  vehicle_no?: string
  capacity: number
  is_active: boolean
}

// ── Library ───────────────────────────────────────────
export interface Book {
  id: number
  title: string
  author?: string
  isbn?: string
  category?: string
  quantity: number
  available_qty: number
  price: number
}

// ── Inventory ─────────────────────────────────────────
export interface InventoryItem {
  id: number
  item_code: string
  name: string
  category?: string
  quantity: number
  min_stock: number
  unit_price: number
}

// ── Communication ─────────────────────────────────────
export interface Notification {
  id: number
  title: string
  message: string
  type: 'email' | 'sms' | 'push' | 'internal'
  target_role?: string
  status: 'pending' | 'sent' | 'failed'
  created_at: string
}

export interface Message {
  id: number
  sender_id: number
  receiver_id: number
  subject?: string
  body: string
  is_read: boolean
  created_at: string
}

// ── Dashboard ─────────────────────────────────────────
export interface DashboardSummary {
  total_students: number
  total_employees: number
  fees_collected: number
  fees_pending: number
}
