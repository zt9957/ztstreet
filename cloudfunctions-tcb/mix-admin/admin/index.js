'use strict';

const uniID = require('uni-id-admin');

const db = uniCloud.database();
const dbCmd = db.command;
const $ = db.command.aggregate;

const userDb = db.collection('mix-uni-id-users');

const modal = {
	/**
	 * 管理员登录
	 * @param {Object} request
	 * @param {String} request.username
	 * @param {String} request.password
	 */
	async login(request) {
		const {username, password} = request;
		const res = await uniID.login({
			username,
			password
		})
		return res.code === 0 ? {
			status: 1,
			...res
		}: {
			status: 0,
			...res
		}
	},
	/**
	 * 获取管理员信息
	 */
	async get(request, ext){
		const res = await db.collection('mix-admin').where({
			_id: ext.adminId
		}).get();
		
		return res.data.length === 1 ? {
			status: 1,
			data: res.data[0]
		}:{
			status: 0,
			msg: '获取管理员信息失败'
		}
	},
	/**
	 * 修改密码
	 * @param {Object} request
	 * @param {String} request.oldPassword
	 * @param {String} request.newPassword
	 * @param {String} request.passwordConfirmation
	 */
	async resetPassword(request, ext){
		const {
			oldPassword,
			newPassword,
			passwordConfirmation
		} = request;
		const res = await uniID.updatePwd({
			uid: ext.adminId,
			oldPassword,
			newPassword,
			passwordConfirmation
		})
		return res.code === 0 ? {
			status: 1,
			msg: '密码修改成功，请重新登录'
		}:{
			status: 0,
			...res,
			ext
		}
	},
	/**
	 * 退出登录
	 * @param {Object} request
	 * @param {Object} ext
	 */
	async logout(request, ext){
		if(!ext.token){
			return {
				status: 1
			}
		}
		const res = await uniID.logout(ext.token)
		return {
			status: 1,
			...res
		}
	},
	/**
	 * 添加管理员
	 * @param {Object} request
	 */
	/* async register(){
		const res = await uniID.register({
			username: 'admin',
			password: '12345678',
			roles_id: 'abd27dd45f3109c80059c9a5199f4192',
			status: 0
		})
	}, */

}

module.exports = modal;
