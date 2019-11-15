const BufferList = require('bl/BufferList')
const Reader = require('it-reader')

module.exports = function LteReader (source) {
  const reader = Reader(source)
  let overflow
  return {
    [Symbol.asyncIterator] () { return this },
    next: bytes => {
      if (overflow) {
        let value
        if (overflow.length === bytes) {
          value = overflow
          overflow = null
        } else if (overflow.length > bytes) {
          value = overflow.shallowSlice(0, bytes)
          overflow = overflow.shallowSlice(bytes)
        } else if (overflow.length < bytes) {
          const { value: nextValue, done } = reader.next(bytes - overflow.length)
          value = done ? overflow : new BufferList([overflow, nextValue])
          overflow = null
        }
        return { value }
      }
      return reader.next(bytes)
    },
    nextLte: async bytes => {
      const { done, value } = await reader.next()
      if (done) return { done }
      if (value.length <= bytes) return { value }
      if (value.shallowSlice) {
        overflow = value.shallowSlice(bytes)
        return { value: value.shallowSlice(0, bytes) }
      } else {
        overflow = new BufferList(value.slice(bytes))
        return { value: value.slice(0, bytes) }
      }
    }
  }
}
