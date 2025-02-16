<template>
  <div class="activity-grid text-sm">
    <div class="relative flex">
      <!-- Month labels -->
      <div
        class="month-labels absolute -top-6 left-8 right-0 flex justify-start"
      >
        <div
          v-for="month in monthLabels"
          :key="month.index"
          :style="{
            width: `${month.width}px`,
            marginLeft: `${month.offset}px`,
          }"
          class="text-xs text-gray-600"
        >
          {{ month.label }}
        </div>
      </div>

      <!-- Days of week labels -->
      <div
        class="flex flex-col justify-start gap-[2px] pr-2 text-xs text-gray-600"
      >
        <div class="h-[10px]"></div>
        <div class="h-[10px]">Mon</div>
        <div class="h-[10px]"></div>
        <div class="h-[10px]">Wed</div>
        <div class="h-[10px]"></div>
        <div class="h-[10px]">Fri</div>
        <div class="h-[10px]"></div>
      </div>

      <!-- Activity cells -->
      <div class="flex gap-[2px]">
        <div v-for="week in weeks" :key="week" class="flex flex-col gap-[2px]">
          <div v-for="dayIndex in 7" :key="dayIndex" class="h-[10px] w-[10px]">
            <div
              v-if="isValidDate(week, dayIndex - 1)"
              :class="[
                'h-full w-full rounded-sm',
                getCellColor(getActivityLevel(week, dayIndex - 1)),
                'hover:ring-1 hover:ring-gray-400',
              ]"
              :title="getCellDate(week, dayIndex - 1)"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-2 flex items-center text-xs text-gray-600">
      <span class="mr-2">Less</span>
      <div class="flex gap-1">
        <div class="h-[10px] w-[10px] rounded-sm bg-gray-100"></div>
        <div class="h-[10px] w-[10px] rounded-sm bg-emerald-100"></div>
        <div class="h-[10px] w-[10px] rounded-sm bg-emerald-300"></div>
        <div class="h-[10px] w-[10px] rounded-sm bg-emerald-500"></div>
        <div class="h-[10px] w-[10px] rounded-sm bg-emerald-700"></div>
      </div>
      <span class="ml-2">More</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    posts: { date: string; count: number }[];
    year?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    year: () => new Date().getFullYear(),
  });

  // Calculate month labels with proper positioning
  const monthLabels = computed(() => {
    const months = [];
    const date = new Date(props.year, 0, 1);
    const weekSize = 13; // Width of a week in pixels (10px cell + 3px gap)

    while (date.getFullYear() === props.year) {
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const weekIndex = Math.floor(
        (firstDayOfMonth.getTime() - new Date(props.year, 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );

      months.push({
        label: date.toLocaleString('en-US', { month: 'short' }),
        index: date.getMonth(),
        width: 30,
        offset: weekIndex * weekSize,
      });

      date.setMonth(date.getMonth() + 1);
    }
    return months;
  });

  // Calculate the number of weeks to show
  const weeks = computed(() => {
    const firstDay = new Date(props.year, 0, 1);
    const lastDay = new Date(props.year, 11, 31);
    return (
      Math.ceil(
        (lastDay.getTime() - firstDay.getTime()) / (7 * 24 * 60 * 60 * 1000)
      ) + 1
    );
  });

  // Check if the date is valid for the current year
  function isValidDate(week: number, dayIndex: number): boolean {
    const date = new Date(props.year, 0, 1);
    date.setDate(date.getDate() + (week * 7 + dayIndex));
    return date.getFullYear() === props.year;
  }

  // Get the activity level for a specific cell
  function getActivityLevel(week: number, dayIndex: number): number {
    const date = new Date(props.year, 0, 1);
    date.setDate(date.getDate() + (week * 7 + dayIndex));

    const dateStr = date.toISOString().split('T')[0];
    const post = props.posts.find((p) => p.date === dateStr);

    if (!post) return 0;
    if (post.count === 0) return 0;
    if (post.count === 1) return 1;
    if (post.count <= 3) return 2;
    if (post.count <= 6) return 3;
    return 4;
  }

  // Get the color class based on activity level
  function getCellColor(level: number): string {
    switch (level) {
      case 0:
        return 'bg-gray-100';
      case 1:
        return 'bg-emerald-100';
      case 2:
        return 'bg-emerald-300';
      case 3:
        return 'bg-emerald-500';
      case 4:
        return 'bg-emerald-700';
      default:
        return 'bg-gray-100';
    }
  }

  // Get the formatted date for the tooltip
  function getCellDate(week: number, dayIndex: number): string {
    const date = new Date(props.year, 0, 1);
    date.setDate(date.getDate() + (week * 7 + dayIndex));
    const count =
      props.posts.find((p) => p.date === date.toISOString().split('T')[0])
        ?.count || 0;
    return `${count} posts on ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }
</script>

<style scoped>
  .activity-grid {
    font-size: 12px;
  }
</style>
