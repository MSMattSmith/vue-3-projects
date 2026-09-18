<template>
  <g class="pine-forest">
    <g v-for="(tree, index) in trees" :key="`tree-${index}`" :transform="`translate(${tree.cx}, ${tree.cy}) scale(${tree.scale})`" class="angled-tree">
      <ellipse cx="0" cy="5" rx="15" ry="5.5" fill="#000000" opacity="0.3" />
      <path d="M 0,-14 C 5,-14 12,-4 18,3 C 14,7 10,4 6,7 C 2,4 -2,4 -6,7 C -10,4 -14,7 -18,3 C -12,-4 -5,-14 0,-14 Z" fill="url(#tier-base-grad)" />
      <g class="sway-mid-tier" :style="{ transformOrigin: '0px -10px', animationDelay: `${tree.animDelay}s` }">
        <path d="M 0,-26 C 4,-26 10,-16 15,-8 C 11,-5 8,-7 4,-4 C 1,-6 -1,-6 -4,-4 C -8,-7 -11,-5 -15,-8 C -10,-16 -4,-26 0,-26 Z" fill="url(#tier-mid-grad)" />
      </g>
      <g class="sway-top-tier" :style="{ transformOrigin: '0px -20px', animationDelay: `${tree.animDelay}s` }">
        <path d="M 0,-42 C 3,-42 7,-30 11,-20 C 8,-17 5,-19 2,-16 C 0,-17 0,-17 -2,-16 C -5,-19 -8,-17 -11,-20 C -7,-30 -3,-42 0,-42 Z" fill="url(#tier-top-grad)" />
        <path d="M 0,-42 L 3,-30 Q 0,-27 -3,-30 Z" fill="#A2EAA2" opacity="0.4" />
      </g>
    </g>
  </g>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
defineProps({ trees: { type: Array, required: true } })
</script>
