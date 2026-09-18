<template>
  <g>
    <g class="grid-layer">
      <template v-for="x in gridWidth" :key="`col-${x}`">
        <template v-for="y in gridHeight" :key="`cell-${x}-${y}`">
          <rect :x="(x - 1) * tileSize" :y="(y - 1) * tileSize" :width="tileSize" :height="tileSize"
            :fill="isForestTile(x - 1, y - 1) ? '#18331C' : '#EFF1E8'"
            :stroke="isForestTile(x - 1, y - 1) ? '#122916' : '#E1E4D7'" stroke-width="1" />
        </template>
      </template>
    </g>
    <path :d="riverPathD" fill="#5AA9E6" stroke="#4A98D5" stroke-width="2" />
    <g class="dolomites-east" >
      <path d="M 720,0 C 700,50 675,80 680,140 C 685,200 655,240 660,320 C 665,390 635,460 640,560 L 800,560 L 800,0 Z" fill="url(#mnt-slope-dark)" />
      <path d="M 745,0 C 730,60 700,100 710,160 C 720,220 685,270 690,360 C 695,430 665,490 670,560 L 800,560 L 800,0 Z" fill="url(#mnt-slope-light)" />
      <path d="M 770,0 C 755,70 730,120 738,190 C 745,250 715,310 720,410 C 725,480 695,520 705,560 L 800,560 L 800,0 Z" fill="url(#mnt-slope-dark)" opacity="0.25" />
      <path d="M 770,0 C 755,70 730,120 738,190 L 752,185 C 742,120 768,70 782,0 Z" fill="url(#snow-crest-grad)" />
      <path d="M 738,190 C 745,250 715,310 720,410 L 734,405 C 728,310 758,250 752,185 Z" fill="url(#snow-crest-grad)" opacity="0.9" />
      <text :x="(gridWidth - 1.8) * tileSize" :y="2.2 * tileSize" fill="#1F232B" font-weight="900" font-size="10" letter-spacing="1.5" style="text-shadow: 1px 1px 0px #FFFFFF">PITLA CIR</text>
    </g>
  </g>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
defineProps({
  gridWidth: { type: Number, required: true }, gridHeight: { type: Number, required: true }, tileSize: { type: Number, required: true },
  riverPathD: { type: String, required: true }, isForestTile: { type: Function, required: true }
})
</script>
