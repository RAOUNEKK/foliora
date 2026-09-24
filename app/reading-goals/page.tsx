'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, Check, Trophy, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useReadingGoals } from '@/hooks/useReadingGoals';
import type { ReadingGoal } from '@/hooks/useReadingGoals';

export default function ReadingGoalsPage() {
  const { goals, loading, createGoal, updateGoal, deleteGoal } = useReadingGoals();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [goalType, setGoalType] = useState<'books' | 'pages' | 'custom'>('books');
  const [deadline, setDeadline] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGoal({
      title,
      description: description || null,
      target_value: parseInt(targetValue),
      current_value: 0,
      goal_type: goalType,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });
    setShowForm(false);
    setTitle('');
    setDescription('');
    setTargetValue('');
    setDeadline('');
  };

  const handleProgressUpdate = async (goal: ReadingGoal, increment: number) => {
    const newValue = Math.min(goal.target_value, goal.current_value + increment);
    const completed = newValue >= goal.target_value;
    await updateGoal(goal.id, { current_value: newValue, completed });
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0602' }}>
      <Navbar />

      <section className="pt-28 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(20,12,4,1) 0%, rgba(10,6,2,1) 100%)',
        }} />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(218,165,32,0.4) 0%, transparent 50%)',
        }} />

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <Target size={24} className="text-gold-DEFAULT" />
              <h1 className="text-3xl md:text-4xl text-cream-100" style={{ fontFamily: 'Cinzel', letterSpacing: '0.05em' }}>
                Reading Goals
              </h1>
            </div>
            <motion.button
              onClick={() => setShowForm(true)}
              className="btn-enchanted px-5 py-2.5 rounded-xl text-wood-900 font-bold text-sm flex items-center gap-2"
              style={{ fontFamily: 'Cinzel', letterSpacing: '0.1em' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus size={16} />
              New Goal
            </motion.button>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* New Goal Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              onSubmit={handleCreate}
              className="mb-8 p-6 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(218,165,32,0.2)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-cream-100 text-sm font-semibold" style={{ fontFamily: 'Cinzel' }}>Create New Goal</h3>
                <button onClick={() => setShowForm(false)} className="text-cream-400/40 hover:text-cream-200">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Goal title (e.g., Read 10 books)"
                  className="bg-transparent border rounded-xl px-4 py-3 text-cream-100 text-sm input-gold"
                  style={{ borderColor: 'rgba(218,165,32,0.2)', fontFamily: 'EB Garamond' }}
                  required
                />
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as typeof goalType)}
                  className="bg-transparent border rounded-xl px-4 py-3 text-cream-100 text-sm"
                  style={{ borderColor: 'rgba(218,165,32,0.2)', outline: 'none' }}
                >
                  <option value="books" style={{ background: '#1e1408' }}>Books</option>
                  <option value="pages" style={{ background: '#1e1408' }}>Pages</option>
                  <option value="custom" style={{ background: '#1e1408' }}>Custom</option>
                </select>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="Target value"
                  className="bg-transparent border rounded-xl px-4 py-3 text-cream-100 text-sm input-gold"
                  style={{ borderColor: 'rgba(218,165,32,0.2)' }}
                  required
                />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-transparent border rounded-xl px-4 py-3 text-cream-100 text-sm input-gold"
                  style={{ borderColor: 'rgba(218,165,32,0.2)' }}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="md:col-span-2 bg-transparent border rounded-xl px-4 py-3 text-cream-100 text-sm input-gold resize-none"
                  style={{ borderColor: 'rgba(218,165,32,0.2)', fontFamily: 'EB Garamond' }}
                />
              </div>
              <button
                type="submit"
                className="mt-4 btn-enchanted px-6 py-2.5 rounded-xl text-wood-900 font-bold text-sm"
                style={{ fontFamily: 'Cinzel', letterSpacing: '0.1em' }}
              >
                Create Goal
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Goals List */}
        {loading ? (
          <div className="text-center py-16 text-cream-400/40">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16">
            <Target size={48} className="text-gold-DEFAULT/20 mx-auto mb-4" />
            <p className="text-cream-400/40" style={{ fontFamily: 'EB Garamond', fontStyle: 'italic' }}>
              No reading goals yet. Create your first goal!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal, i) => {
              const percentage = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
              const isCompleted = goal.completed;

              return (
                <motion.div
                  key={goal.id}
                  className="p-5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-cream-100 text-sm font-medium" style={{ fontFamily: 'Cinzel' }}>{goal.title}</h3>
                        {isCompleted && <Trophy size={14} className="text-gold-DEFAULT" />}
                      </div>
                      {goal.description && (
                        <p className="text-cream-400/40 text-xs mt-0.5" style={{ fontFamily: 'EB Garamond', fontStyle: 'italic' }}>{goal.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1.5 text-cream-400/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-cream-400/50" style={{ fontFamily: 'Cinzel' }}>
                        {goal.current_value} / {goal.target_value} {goal.goal_type}
                      </span>
                      <span className={isCompleted ? 'text-forest-400' : 'text-gold-DEFAULT'} style={{ fontFamily: 'Cinzel' }}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: isCompleted
                            ? 'linear-gradient(90deg, #10b981, #34d399)'
                            : 'linear-gradient(90deg, #b8860b, #daa520)',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  {!isCompleted && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleProgressUpdate(goal, 1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gold-DEFAULT hover:bg-gold-dark/10 transition-all"
                        style={{ border: '1px solid rgba(218,165,32,0.2)', fontFamily: 'Cinzel' }}
                      >
                        <Plus size={12} /> +1
                      </button>
                      {goal.goal_type === 'pages' && (
                        <button
                          onClick={() => handleProgressUpdate(goal, 10)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gold-DEFAULT hover:bg-gold-dark/10 transition-all"
                          style={{ border: '1px solid rgba(218,165,32,0.2)', fontFamily: 'Cinzel' }}
                        >
                          <Plus size={12} /> +10
                        </button>
                      )}
                      <button
                        onClick={() => handleProgressUpdate(goal, goal.target_value - goal.current_value)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-forest-400 hover:bg-forest-800/20 transition-all"
                        style={{ border: '1px solid rgba(16,185,129,0.2)', fontFamily: 'Cinzel' }}
                      >
                        <Check size={12} /> Complete
                      </button>
                    </div>
                  )}

                  {goal.deadline && (
                    <div className="mt-2 text-cream-400/30 text-xs" style={{ fontFamily: 'EB Garamond' }}>
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
