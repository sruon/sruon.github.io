export class BitReader {
  constructor(data) {
    this.data = data
    this.position = 0
  }

  setPosition(bytePos) {
    this.position = bytePos * 8
  }

  read(bits) {
    let result = 0

    for (let i = 0; i < bits; i++) {
      const byteIndex = Math.floor(this.position / 8)
      const bitIndex = this.position % 8

      if (byteIndex >= this.data.length) {
        break
      }

      const byte = this.data[byteIndex]
      const bit = (byte >> bitIndex) & 1

      result |= (bit << i)
      this.position++
    }

    return result
  }

  getPosition() {
    return this.position
  }
}
