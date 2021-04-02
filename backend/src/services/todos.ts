import { TodoItem } from '../models/TodoItem'
import { DatabaseController } from '../database/controller'    

import { createLogger } from '../utils/logger'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'

const databaseController = new DatabaseController()
const logger = createLogger('Todos businessLogic')

/**
 * Get todos by user id from database
 * @param userId
 * @returns json with the users todos
 */
export async function getTodos(userId: string): Promise<TodoItem[]> {
  logger.info('Get Todos', {
    userId
  })
  return await databaseController.getTodos(userId);
}

/**
 * Update todos by user id from database
 * @param userId
 * @param todoId
 * @param updateTodoRequest
 * @returns json updated todo
 */
export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
) {
  logger.info('Update Todo', {
    userId,
    updatedTodo: updateTodoRequest
  })
  await databaseController.updateTodo(userId, todoId, updateTodoRequest)
}

/**
 * Create todos by user id from database
 * @param userId
 * @param createTodoRequest
 * @returns json created todo
 */
export async function createTodo(
  userId: string,
  createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
  logger.info('Create Todo', {
    userId,
    createdTodo: createTodoRequest
  })
  return await databaseController.createTodo(userId, createTodoRequest)
}

/**
 * Delete todos by user id from database
 * @param userId
 * @param todoId
 */
export async function deleteTodo(userId: string, todoId: string) {
  logger.info('Delete Todo', {
    userId,
    todoId
  })
  await databaseController.deleteTodo(userId, todoId)
}

/**
 * Generate upload url by user id and todo id
 * to attach an image to an existing todo
 *
 * @param userId
 * @param todoId
 * @returns the upload url
 */
export async function generateUploadUrl(userId: string, todoId: string) {
  const uploadUrl = await databaseController.getUploadUrl(todoId)

  logger.info('Get upload url', {
    uploadUrl
  })

  await databaseController.updateAttachmentUrl(userId, todoId)
  return uploadUrl
}
