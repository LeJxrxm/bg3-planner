<script setup lang="ts">
const router = useRouter()
const toast = useToast()

async function onSubmit(data: any) {
  try {
    await $fetch('/api/pois', {
      method: 'POST',
      body: data
    })
    
    toast.add({
      title: 'Succès',
      description: 'Le point d\'intérêt a été créé avec succès',
      color: 'success'
    })
    
    router.push('/pois')
  } catch (error) {
    console.error('Erreur lors de la création', error)
    toast.add({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la création du POI',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class=" mx-auto space-y-4">
    <div class="flex items-center gap-4">
      <UButton to="/pois" icon="i-heroicons-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Ajouter un point d'intérêt</h1>
    </div>

    <UCard>
      <FormPoi @submit="onSubmit" />
    </UCard>
  </div>
</template>
