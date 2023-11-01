export const baseFormRule = (value: any) => {
  if (!value) return '这是必填项'
  return true
}

export const numberFormRule = (value: any) => {
  if (/[^0-9]/.test(value)) return '请输入数字'
  return true
}