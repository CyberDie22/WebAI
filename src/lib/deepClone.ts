export function deepClone<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj
    } else if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        return obj
    } else if (Array.isArray(obj)) {
        let array: any[] = []
        obj.forEach(item => array.push(deepClone<typeof item>(item)))
        return array as T
    } else if (obj instanceof Date) {
        return new Date(obj.getTime()) as T
    } else {
        let newObj = Object.assign({}, obj)
        let fields = Object.getOwnPropertyNames(obj)

        fields.forEach(key => {
            let field = obj[key]
            newObj[key] = deepClone<typeof field>(field)
        })
        return newObj
    }
}