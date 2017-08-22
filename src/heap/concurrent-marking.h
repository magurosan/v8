// Copyright 2017 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef V8_HEAP_CONCURRENT_MARKING_
#define V8_HEAP_CONCURRENT_MARKING_

#include "src/allocation.h"
#include "src/cancelable-task.h"
#include "src/heap/worklist.h"
#include "src/utils.h"
#include "src/v8.h"

namespace v8 {
namespace internal {

class Heap;
class Isolate;
class WeakCell;

class ConcurrentMarking {
 public:
  // When the scope is entered, the concurrent marking tasks
  // are paused and are not looking at the heap objects.
  class PauseScope {
   public:
    explicit PauseScope(ConcurrentMarking* concurrent_marking);
    ~PauseScope();

   private:
    ConcurrentMarking* concurrent_marking_;
  };

  static const int kTasks = 4;
  using MarkingWorklist = Worklist<HeapObject*, 64 /* segment size */>;
  using WeakCellWorklist = Worklist<WeakCell*, 64 /* segment size */>;

  ConcurrentMarking(Heap* heap, MarkingWorklist* shared,
                    MarkingWorklist* bailout, WeakCellWorklist* weak_cells);

  void ScheduleTasks();
  void EnsureCompleted();
  void RescheduleTasksIfNeeded();

 private:
  struct TaskInterrupt {
    // When the concurrent marking task has this lock, then objects in the
    // heap are guaranteed to not move.
    base::Mutex lock;
    // The main thread sets this flag to true, when it wants the concurrent
    // maker to give up the lock.
    base::AtomicValue<bool> request;
    // The concurrent marker waits on this condition until the request
    // flag is cleared by the main thread.
    base::ConditionVariable condition;
    char cache_line_padding[64];
  };
  class Task;
  void Run(int task_id, TaskInterrupt* interrupt);
  Heap* heap_;
  MarkingWorklist* shared_;
  MarkingWorklist* bailout_;
  WeakCellWorklist* weak_cells_;
  TaskInterrupt task_interrupt_[kTasks + 1];
  base::Mutex pending_lock_;
  base::ConditionVariable pending_condition_;
  int pending_task_count_;
  bool is_pending_[kTasks + 1];
};

}  // namespace internal
}  // namespace v8

#endif  // V8_HEAP_PAGE_PARALLEL_JOB_
