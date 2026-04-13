import { supabase } from './supabaseClient';

/**
 * Maps Base44 entity names to Supabase table names.
 * Base44 used PascalCase entities; Supabase uses snake_case tables.
 */
const TABLE_MAP = {
  User: 'users',
  UserAccount: 'user_accounts',
  Classroom: 'classrooms',
  Enrollment: 'enrollments',
  StudentLessonProgress: 'student_lesson_progress',
  LessonAccess: 'lesson_access',
  CourseDetails: 'course_details',
  LessonContent: 'lesson_content',
  Courseware: 'coursewares',
  Announcement: 'announcements',
  Comment: 'comments',
  Reaction: 'reactions',
  UserActivity: 'user_activity',
  EvaluatorProgress: 'evaluator_progress',
  DeletedUserLog: 'deleted_user_log',
  Article: 'articles',
  Competition: 'competitions',
  Quote: 'quotes',
  FundingOpportunity: 'funding_opportunities',
  WordleWord: 'wordle_words',
  PresentationSlide: 'presentation_slides',
  HistoryArchive: 'history_archives',
};

/**
 * Creates entity operations that mirror the Base44 SDK API.
 *
 * Base44 API:
 *   base44.entities.User.list(orderBy)     → SELECT * FROM users ORDER BY ...
 *   base44.entities.User.filter({email})   → SELECT * FROM users WHERE email = ...
 *   base44.entities.User.create({...})     → INSERT INTO users ...
 *   base44.entities.User.update(id, {...}) → UPDATE users SET ... WHERE id = ...
 *   base44.entities.User.delete(id)        → DELETE FROM users WHERE id = ...
 */
function createEntityProxy(tableName) {
  return {
    /**
     * List all rows, optionally ordered.
     * Base44: entity.list("order") or entity.list("-featured_date")
     * Leading "-" means descending.
     */
    async list(orderBy) {
      let query = supabase.from(tableName).select('*');

      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const column = desc ? orderBy.slice(1) : orderBy;
        query = query.order(column, { ascending: !desc });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    /**
     * Filter rows by field equality.
     * Base44: entity.filter({ email: "x@y.com", status: "approved" })
     * Translates to: WHERE email = 'x@y.com' AND status = 'approved'
     */
    async filter(filters) {
      let query = supabase.from(tableName).select('*');

      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    /**
     * Create a new row.
     * Base44: entity.create({ field: value, ... })
     * Returns the created row.
     */
    async create(values) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /**
     * Update a row by ID.
     * Base44: entity.update(id, { field: value, ... })
     * Returns the updated row.
     */
    async update(id, values) {
      const { data, error } = await supabase
        .from(tableName)
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /**
     * Delete a row by ID.
     * Base44: entity.delete(id)
     */
    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  };
}

/**
 * Entity proxy object — access entities like base44.entities.User.filter(...)
 * Usage: entities.User.filter({ email }), entities.Classroom.create({ name })
 */
export const entities = new Proxy({}, {
  get(_, entityName) {
    const tableName = TABLE_MAP[entityName];
    if (!tableName) {
      console.warn(`Unknown entity: ${entityName}. Available: ${Object.keys(TABLE_MAP).join(', ')}`);
      return createEntityProxy(entityName.toLowerCase());
    }
    return createEntityProxy(tableName);
  }
});
