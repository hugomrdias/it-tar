const test = require('tape')
const Zlib = require('zlib')
const Fs = require('fs')
const toIterable = require('stream-to-it')
const pipe = require('it-pipe')
const Tar = require('../')
const Fixtures = require('./fixtures')

test('huge', async t => {
  t.plan(3)

  let noEntries = false
  const hugeFileSize = 8804630528 // ~8.2GB
  let dataLength = 0

  await pipe(
    Fs.createReadStream(Fixtures.HUGE),
    toIterable.transform(Zlib.createGunzip()),
    Tar.extract(),
    async source => {
      for await (const entry of source) {
        t.deepEqual(entry.header, {
          devmajor: 0,
          devminor: 0,
          gid: 20,
          gname: 'staff',
          linkname: null,
          mode: 420,
          mtime: new Date(1521214967000),
          name: 'huge.txt',
          pax: {
            'LIBARCHIVE.creationtime': '1521214954',
            'SCHILY.dev': '16777218',
            'SCHILY.ino': '91584182',
            'SCHILY.nlink': '1',
            atime: '1521214969',
            ctime: '1521214967',
            size: hugeFileSize.toString()
          },
          size: hugeFileSize,
          type: 'file',
          uid: 502,
          uname: 'apd4n'
        })

        for await (const chunk of entry.body) {
          dataLength += chunk.length
        }

        noEntries = true
      }
    }
  )

  t.ok(noEntries)
  t.equal(dataLength, hugeFileSize)
})
