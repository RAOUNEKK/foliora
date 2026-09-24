'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ReadingGoal {
  id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  goal_type: 'books' | 'pages' | 'custom';
  deadline: string | null;
  completed: boolean;
  created_at: string;
}

export function useReadingGoals() {
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reading_goals')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setGoals(data as ReadingGoal[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(async (goal: Omit<ReadingGoal, 'id' | 'created_at' | 'completed'>) => {
    const { data, error } = await supabase
      .from('reading_goals')
      .insert(goal)
      .select()
      .single();
    if (!error && data) {
      setGoals((prev) => [data as ReadingGoal, ...prev]);
    }
    return { data, error };
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<ReadingGoal>) => {
    const { data, error } = await supabase
      .from('reading_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      setGoals((prev) => prev.map((g) => (g.id === id ? data as ReadingGoal : g)));
    }
    return { data, error };
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    const { error } = await supabase.from('reading_goals').delete().eq('id', id);
    if (!error) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
    }
    return { error };
  }, []);

  return { goals, loading, createGoal, updateGoal, deleteGoal, refresh: fetchGoals };
}
