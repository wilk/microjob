/**
 * This example sorts a large array using the quicksort algorithm
 * It uses microjob to divide the load between 8 jobs
 */

import { start, job, stop } from '../src/job'

// utility function to generate random numbers
const ranges = [100, 1000, 10000, 100000, 1000000]
function randomNumber(): Number {
  const numb = Math.random()
  const range = Math.floor(Math.random() * 10) % ranges.length
  return Math.floor(numb * ranges[range])
}

// swap, partition and quickSort are used in conjunction inside the job
function swap(arr, i, j) {
  const temp = arr[i]
  arr[i] = arr[j]
  arr[j] = temp
}

function partition(arr, pivot, left, right) {
  const pivotValue = arr[pivot]
  let partitionIndex = left

  for (let i = left; i < right; i++) {
    if (arr[i] < pivotValue) {
      swap(arr, i, partitionIndex)
      partitionIndex++
    }
  }
  swap(arr, right, partitionIndex)

  return partitionIndex
}

function quickSort(arr, left, right) {
  let pivot, partitionIndex

  if (left < right) {
    pivot = right
    partitionIndex = partition(arr, pivot, left, right)

    quickSort(arr, left, partitionIndex - 1)
    quickSort(arr, partitionIndex + 1, right)
  }

  return arr
}

// prepare the main dataset and split it into subsets with the same length
const MAX_LEN = 1000
const largeArray = Array.from({ length: MAX_LEN }).map(randomNumber)
const WORKERS = 8
const datasets = []
const PART = MAX_LEN / WORKERS

for (let i = 0; i < WORKERS; i++) {
  datasets.push(largeArray.slice(i * PART, (i * PART) + PART))
}

const main = async () => {
  await start({ maxWorkers: WORKERS })

  // sort the datasets separately
  const promises = datasets.map(data => job(dataset => quickSort(dataset, 0, dataset.length - 1), { data, ctx: { swap, partition, quickSort } }))

  const results = await Promise.all(promises)
  // merge the resulting arrays
  const arr = results.reduce((acc, list) => {
    acc.push(...list)
    return acc
  }, [])

  // and do the last sort
  const sorted = quickSort(arr, 0, arr.length - 1)

  await stop()

  console.log('*** UNSORTED ARRAY SLICES ***')
  console.log(largeArray.slice(0, 10))
  console.log(largeArray.slice(500, 510))
  console.log(largeArray.slice(900, 910))

  console.log('*** SORTED ARRAY SLICES ***')
  console.log(sorted.slice(0, 10))
  console.log(sorted.slice(500, 510))
  console.log(sorted.slice(900, 910))
}

main()