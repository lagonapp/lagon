<script setup>
const { data: user, pending } = useLazyFetch('/api/random')
</script>

<template>
  <div>
    <header>
      Header
      <div  v-if="pending">
        Loading...
      </div>
      <ul v-else>
        <li>
          <NuxtLink to="/">/</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/about">/about</NuxtLink>
        </li>
        <li>
          <NuxtLink :to="`/users/${user.name}`">/users/{{ user.name }}</NuxtLink>
        </li>
      </ul>
    </header>
    <slot />
    <footer>Footer</footer>
  </div>
</template>
