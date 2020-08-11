'use strict';

const crypto = require('crypto');
const {
	kuaidi100
} = require('config')

const db = uniCloud.database();
const dbCmd = db.command;

const orderDb = db.collection('mix-order');

const orderStatus = [
	{status: 0, name: '待付款'},
	{status: 1, name: '待发货'},
	{status: 2, name: '待收货'},
	{status: 3, name: '待评价'},
	{status: 4, name: '已完成'},
	{status: 10, name: '已关闭'}, //未付款取消订单
	{status: 11, name: '已取消'}, //已付款取消订单
	{status: 12, name: '申请退货'},
	{status: 13, name: '退货申请失败'},
	{status: 14, name: '正在退货'},
	{status: 15, name: '退货完成'}
]

const modal = {
	/**
	 * 获取订单列表
	 * @param {Object} request
	 * @param {Number} request.offset
	 * @param {Number} request.limit
	 * @param {String} request.order_number
	 * @param {String} request.username
	 * @param {String} request.addr_name
	 * @param {Number} request.status
	 */
	async getList(request, ext){
		const {offset, limit, order_number, username, addr_name, status} = request;
		const map = {}
		
		if(order_number) map.order_number = new RegExp(order_number);
		if(username) map.username = new RegExp(username);
		if(addr_name) map.address = {
			name: new RegExp(addr_name)
		}
		if(status || status === 0) map.status = status;
		
		const res = await orderDb.aggregate()
			.match(map)
			.sort({
				add_time: -1
			})
			.skip(offset)
			.limit(limit)
			.lookup({
				from: "mix-uni-id-users",
				localField: "uid",
				foreignField: "_id",
				as: 'user'
			})
			.end();
		
		const countData = await orderDb.where(map).count();
		res.affectedDocs = countData.total;
		res.data.forEach(item=> {
			item.status_text = orderStatus.filter(s=> s.status === item.status)[0].name;
			item.user = item.user.length > 0 ? item.user[0] : {};
		})
		res.map = map;
		return res;
	},
	/**
	 * 获取物流公司列表
	 */
	async getExpressComp(){
		const res = await db.collection('mix-express').get();
		return res;
	},
	/**
	 * 订单发货
	 * @param {Object} request
	 * @param {String} request.order_id
	 * @param {String} request.shipper_code 物流公司代码
	 * @param {String} request.shipper_name 物流公司名称
	 * @param {String} logistic_code 快递单号
	 */
	async deliveryOrder(request, ext){
		const {order_id, shipper_code, shipper_name, logistic_code} = request;
		const orderData = await orderDb.doc(order_id).get();
		const order = orderData.data[0];
		if(order.status !== 1){
			return {
				status: 0,
				msg: '订单状态错误'
			}
		}
		const timeline = order.timeline;
		timeline.unshift({
			time: + new Date(),
			title: '订单已发货',
			tip: '您的宝贝已由' + shipper_name + '护送出发了哦',
			type: '订单发货'
		})
		const res = await orderDb
			.doc(order_id)
			.update({
				status: 2,
				status_tip: shipper_name + '已揽收，正在配送中..',
				shipper_code,
				logistic_code,
				timeline
			})
		return res.updated === 1 ? {
			status: 1,
			msg: '发货成功'
		}:{
			status: 0,
			msg: '发货失败'
		}
	},
	/**
	 * 查询物流信息
	 * @param {Object} request
	 * @param {String} request.order_id 订单id
	 * @param {String} request.shipper_code 快递公司代码
	 * @param {String} request.logistic_code 快递单号
	 * @param {String} request.phone 收件人或寄件人的手机号或固话（顺丰单号必填，也可以填写后四位，如果是固话，请不要上传分机号）
	 */
	async getExpressInfo(request, ext) {
		const {
			order_id,
			shipper_code,
			logistic_code,
			phone
		} = request;
		//查询订单是否存在物流信息，若已存在则不再请求三方接口
		const orderData = await orderDb.doc(order_id).get();
		if (orderData.data[0].express_info) {
			return {
				status: 1,
				type: 'orderTable',
				data: orderData.data[0].express_info
			}
		}
		const expRes = await db.collection('mix-express')
			.where({
				code: shipper_code
			})
			.limit(1).get();
		const expressComp = expRes.data[0];
		const param = {
			'com': shipper_code, //快递公司编码
			'num': logistic_code, //快递单号
			'from': '', //出发地城市
			'phone': phone || '', //手机号
			'to': '', //目的地城市
			'resultv2': '0', //开启行政区域解析
			'show': '0',
			'order': 'desc'
		}
		const {
			customer,
			key
		} = kuaidi100;
		let url = 'http://poll.kuaidi100.com/poll/query.do';
		url += '?customer=' + customer;
		url += '&sign=' + crypto.createHash('md5').update(JSON.stringify(param) + key + customer).digest("hex").toUpperCase();
		url += '&param=' + JSON.stringify(param);
	
		const res = await uniCloud.httpclient.request(url, {
			method: 'POST',
			dataType: 'json'
		})
		//若已签收，将物流信息存入订单表，节省三方平台流量费用
		if (res.data.state == 3) {
			await orderDb.doc(order_id).update({
				express_info: {
					name: expressComp.name,
					logo: expressComp.logo,
					phone: expressComp.phone,
					...res.data
				}
			})
		}
		return res.data.status === '200' && res.data.message === 'ok' ? {
			status: 1,
			data: {
				name: expressComp.name,
				logo: expressComp.logo,
				phone: expressComp.phone,
				...res.data
			}
		} : {
			status: 0,
			msg: res.data.message || '物流信息查询失败',
			url,
			data: res.data
		}
	},
	
	
}

module.exports = modal;