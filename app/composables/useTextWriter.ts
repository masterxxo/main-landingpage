import type { MaybeRefOrGetter } from 'vue'
import { REDUCED_MOTION_QUERY } from '~/constants/media'

interface TextWriterOptions {
  msPerCharacter?: number
}

export function useTextWriter(
  text: string,
  active: MaybeRefOrGetter<boolean>,
  options: TextWriterOptions = {},
) {
  const writtenText = ref('')
  const isWriting = ref(false)
  const msPerCharacter = options.msPerCharacter ?? 28

  let timerId: ReturnType<typeof setTimeout> | null = null
  let reducedMotionQuery: MediaQueryList | null = null
  let hasWritten = false

  function clearTimer(): void {
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  function writeNextCharacter(): void {
    const nextLength = writtenText.value.length + 1
    writtenText.value = text.slice(0, nextLength)

    if (nextLength >= text.length) {
      isWriting.value = false
      timerId = null
      return
    }

    timerId = setTimeout(writeNextCharacter, msPerCharacter)
  }

  function start(): void {
    if (hasWritten || !toValue(active)) return
    hasWritten = true

    if (reducedMotionQuery?.matches) {
      writtenText.value = text
      return
    }

    isWriting.value = true
    writeNextCharacter()
  }

  watch(() => toValue(active), isActive => {
    if (isActive) start()
  })

  onMounted(() => {
    reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    start()
  })

  onBeforeUnmount(clearTimer)

  return { writtenText, isWriting }
}
