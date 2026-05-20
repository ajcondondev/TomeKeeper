import { Router } from 'express'
import { getImports, getImport, getImportRows } from '../controllers/importsController.js'
import { authenticate } from '../middleware/authenticate.js'

export const importsRouter = Router()

importsRouter.use(authenticate)

importsRouter.get('/', getImports)
importsRouter.get('/:id', getImport)
importsRouter.get('/:id/rows', getImportRows)
