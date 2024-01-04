const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { CustomError, TypeError } = require('../models/customError.model');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const Product = db.product;
const Review = db.review;

class MainController {
  async getPostCountryList(req, res) {
    const countryResponse = await axios.get('https://www.pochta.ru/api/suggestions/api/v1/country-dictionary.find-all');

    const countryList = countryResponse.data?.map((item) => ({ value: item?.numericCode, label: item?.russianName }));
    res.json(countryList);
  }
  async findPostAddresses(req, res) {
    const { query } = req.query;
    const response = await axios.post('https://www.pochta.ru/api/suggestions/api/v2/suggestion.find-addresses', { query, limit: 5, language: 'RUSSIAN', mailDirection: 'INTERNAL', fromBound: 'REGION', toBound: 'HOUSE' });
    const posrAddresses = response.data?.filter((item) => item?.precision !== 'CITY')?.map((item) => ({ value: item?.addressGuid, label: `${item?.postalCode ? `${item?.postalCode} ` : ''}${item?.normalizedAddress}`, ...item }));
    res.json(posrAddresses);
  }

  async calculatePostCost(req, res) {
    const data = req.body;
    // const data = {
    //   common: {
    //     recipientAddress: 'г Санкт-Петербург, тер. Горелово, ул Дачная',
    //     recipientCity: 'Санкт-Петербург',
    //     recipientCountryName: 'Российская Федерация',
    //     recipientRegion: 'Санкт-Петербург',
    //     senderAddress: 'г Москва, п Первомайское, д Пучково, ул Троицкая, д. 1',
    //     senderCity: 'Пучково',
    //     senderCountryName: 'Российская Федерация',
    //     senderRegion: 'Москва',
    //   },
    //   cost: {
    //     recipientAddressGuid: '675e0aaf-f290-4263-8263-5118ec5d08ab',
    //     senderAddressGuid: 'a661940d-5d8f-4fdb-abaf-5df6224ae154',
    //     recipientCountryNumericCode: '643',
    //     recipientPostalCode: '198323',
    //     senderPostalCode: '108807',
    //   },
    // };
    const response = await axios.post('https://www.pochta.ru/api/calculator/api/v2/calculator.calculate-cost-time-text', {
      costRequestDto: {
        cashOnDeliveryInKopecks: 0,
        declaredValueInKopecks: 0,
        deliveryType: 'NORMAL',
        hasCarefullyMark: false,
        hasDeliveryOnCall: false,
        hasEuv: false,
        hasHomeDelivery: false,
        hasInventory: false,
        hasNotificationOfDelivery: false,
        hasRecipientSmsNotification: false,
        hasSenderSmsNotification: false,
        hasSmsPackage: false,
        isOrdered: false,
        activeMailType: 'PARCEL',
        mailType: 'PARCEL',
        transferSumInKopecks: 0,
        bonusAccountInfo: null,
        step: 1,
        hasDocumentsDelivery: false,
        ...data.cost,
      },
      isPayonline: false,
      recipientDistrict: '',
      senderDistrict: '',
      ...data.common,
    });
    if (response.data?.costs?.standardCost?.errors) {
      console.log(response.data?.costs?.standardCost?.errors);
      throw new CustomError(404);
    }
    res.json(response.data);
  }

  async getProductReviews(req, res) {
    const { productId } = req.query;
    const findReviews = await Review.findAll({ where: { productId } });
    res.json(findReviews);
  }
}

module.exports = new MainController();
