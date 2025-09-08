<template>
  <div class="beautify-flower">
    <div class="one common"></div>
    <div class="two common"></div>
    <div class="three common"></div>
    <div class="four common"></div>
    <div class="five common"></div>
    <div class="six common"></div>
    <div class="seven common"></div>
    <div class="eight common"></div>
  </div>
</template>
<script></script>
<style lang="scss" scope>
.beautify-flower {
  width: var(--boxWidth);
  height: var(--boxWidth);
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  overflow: hidden;
  animation: container 5s linear infinite;
  -moz-animation: container 5s linear infinite;
  /* Firefox */
  -webkit-animation: container 5s linear infinite;
  /* Safari and Chrome */
  -o-animation: container 5s linear infinite;
  /* Opera */

  .common {
    height: var(--itemHeight);
    max-height: 100%;
    overflow: auto;
    width: var(--itemWidth);
    margin: auto;
    max-width: 100%;
    position: absolute;
    border-radius: 0 30rem 0 30rem;
    box-shadow: inset 0 0 0rem 2rem #e645d0, 0 0 10rem 0 #e645d0;
  }

  .one {
    transform: rotate(45deg);
    left: 0;
    right: 0;
    top: 0;
    bottom: var(--left);
  }
  .two {
    transform: rotate(90deg);
    left: var(--bottom);
    right: 0;
    top: 0;
    bottom: var(--bottom);
  }
  .three {
    transform: rotate(135deg);
    left: var(--left);
    right: 0;
    top: 0;
    bottom: 0;
  }
  .four {
    transform: rotate(180deg);
    left: var(--bottom);
    right: 0;
    top: var(--bottom);
    bottom: 0;
  }
  .five {
    transform: rotate(225deg);
    left: 0;
    right: 0;
    top: var(--left);
    bottom: 0;
  }
  .six {
    transform: rotate(270deg);
    left: 0;
    right: var(--bottom);
    top: var(--bottom);
    bottom: 0;
  }
  .seven {
    transform: rotate(315deg);
    left: 0;
    right: var(--left);
    top: 0;
    bottom: 0;
  }
  .eight {
    transform: rotate(360deg);
    left: 0;
    right: var(--bottom);
    top: 0;
    bottom: var(--bottom);
  }

  .one {
    animation: one 1s ease infinite;
    -moz-animation: one 1s ease infinite;
    /* Firefox */
    -webkit-animation: one 1s ease infinite;
    /* Safari and Chrome */
    -o-animation: one 1s ease infinite;
    /* Opera */
  }

  @keyframes one {
    0%,
    100% {
    }
    50% {
      box-shadow: inset 0 0 0 2rem #17e1e6, 0 0 10rem 0 #17e1e6;
    }
  }

  .two {
    animation: two 1s 0.125s ease infinite;
    -moz-animation: two 1s 0.125s ease infinite;
    /* Firefox */
    -webkit-animation: two 1s 0.125s ease infinite;
    /* Safari and Chrome */
    -o-animation: two 1s 0.125s ease infinite;
    /* Opera */
  }

  @keyframes two {
    0%,
    100% {
    }
    50% {
      box-shadow: inset 0 0 0 1rem #17e1e6, 0 0 10rem 0 #17e1e6;
    }
  }

  .three {
    animation: three 1s 0.25s ease infinite;
    -moz-animation: three 1s 0.25s ease infinite;
    /* Firefox */
    -webkit-animation: three 1s 0.25s ease infinite;
    /* Safari and Chrome */
    -o-animation: three 1s 0.25s ease infinite;
    /* Opera */
  }

  @keyframes three {
    0%,
    100% {
    }
    50% {
      box-shadow: inset 0 0 0 1rem #17e1e6, 0 0 10rem 0 #17e1e6;
    }
  }

  .four {
    animation: four 1s 0.375s ease infinite;
    -moz-animation: four 1s 0.375s ease infinite;
    /* Firefox */
    -webkit-animation: four 1s 0.375s ease infinite;
    /* Safari and Chrome */
    -o-animation: four 1s 0.375s ease infinite;
    /* Opera */
  }

  @keyframes four {
    0%,
    100% {
    }
    50% {
      box-shadow: inset 0 0 0 1rem #17e1e6, 0 0 10rem 0 #17e1e6;
    }
  }

  .five {
    animation: five 1s 0.5s ease infinite;
    -moz-animation: five 1s 0.5s ease infinite;
    /* Firefox */
    -webkit-animation: five 1s 0.5s ease infinite;
    /* Safari and Chrome */
    -o-animation: five 1s 0.5s ease infinite;
    /* Opera */
  }

  @keyframes five {
    0%,
    100% {
    }
    50% {
      box-shadow: inset 0 0 0 1rem #17e1e6, 0 0 10rem 0 #17e1e6;
    }
  }

  .six {
    animation: six 1s 0.625s ease infinite;
    -moz-animation: six 1s 0.625s ease infinite;
    /* Firefox */
    -webkit-animation: six 1s 0.625s ease infinite;
    /* Safari and Chrome */
    -o-animation: six 1s 0.625s ease infinite;
    /* Opera */
  }

  @keyframes six {
    0%,
    100% {
    }
    50% {
      box-shadow: inset 0 0 0 1rem #17e1e6, 0 0 10rem 0 #17e1e6;
    }
  }

  .seven {
    animation: seven 1s 0.75s ease infinite;
    -moz-animation: seven 1s 0.75s ease infinite;
    /* Firefox */
    -webkit-animation: seven 1s 0.75s ease infinite;
    /* Safari and Chrome */
    -o-animation: seven 1s 0.75s ease infinite;
    /* Opera */
  }

  @keyframes seven {
    0%,
    100% {
    }
    50% {
      box-shadow: inset 0 0 0 1rem #17e1e6, 0 0 10rem 0 #17e1e6;
    }
  }

  .eight {
    animation: eight 1s 0.875s ease infinite;
    -moz-animation: eight 1s 0.875s ease infinite;
    /* Firefox */
    -webkit-animation: eight 1s 0.875s ease infinite;
    /* Safari and Chrome */
    -o-animation: eight 1s 0.875s ease infinite;
    /* Opera */
  }

  @keyframes eight {
    0%,
    100% {
    }
    50% {
      box-shadow: inset 0 0 0 1rem #17e1e6, 0 0 10rem 0 #17e1e6;
    }
  }
}

@keyframes container {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}
</style>
