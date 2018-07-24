{
  async function* read() {
    yield await Promise.resolve(1)
    yield await Promise.resolve(2)
  }

  const iterator = read()

  async function main() {
    for await (const x of iterator) {
      console.log(x)
    }
  }

  main().catch(console.error)
}
