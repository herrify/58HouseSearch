"use strict";

// 地图控制器相关，封装了地图对象
var mapController = define(['jquery', 'AMUI', 'mapSignleton', 'marker', 'polygon', 'workLocation', 'city', 'commuteGo'], function($, AMUI, mapSignleton, marker, polygon, workLocation, city, commuteGo) {
    var _map = mapSignleton.map;
    var _amapTransfer = null;
    var _infoWindow = mapSignleton.infoWindow;
    var _workAddress = mapSignleton.workAddress;

    var addToolbar = function() {
        _map.plugin(["AMap.ToolBar"], function() {
            _map.addControl(new AMap.ToolBar());
        });
        if (location.href.indexOf('&guide=1') !== -1) {
            _map.setStatus({ scrollWheel: false })
        }
    }

    var GetDataByIndex = function(index, pagecount) {
        $.ajax({
            type: "post",
            url: getDataByIndexAction,
            data: { cnName: city.shortName, index: index },
            success: function(result) {
                if (result.IsSuccess) {
                    var rent_locations = new Set();
                    result.HouseInfos.forEach(function(item, index) {
                        rent_locations.add(item);
                    });
                    rent_locations.forEach(function(element, index) {
                        marker.add(element.HouseLocation, element.Money, element.HouseURL,
                            element.LocationMarkBG);
                    });
                } else {
                    console.log(result.Error);
                }
                if (index == pagecount) {
                    $.AMUI.progress.done();
                }

            }
        });
    }

    var init = function() {

        // from addToolbar.js of amap.com
        addToolbar();

        _map.addControl(new AMap.Scale());

        // 箭头函数，保证在 event 中 this 环境正确
        // require r.js uglify 方法暂时不支持箭头函数语法，使用 bind 实现
        AMap.event.addListener(new AMap.Autocomplete({
            input: "work-location"
        }), "select", function(e) { workLocation.onSelected(e); }.bind(workLocation));

        showCityInfo(function() {
            $.AMUI.progress.start();
            for (var i = 1; i <= 15; i++) {
                GetDataByIndex(i, 15);
            }
        })
    }

    var showCityInfo = function(ajaxGetter) {
        //实例化城市查询类
        var citysearch = new AMap.CitySearch();
        //自动获取用户IP，返回当前城市

        citysearch.getLocalCity(function(status, result) {
            if (status === 'complete' && result.info === 'OK') {
                if (result && result.city && result.bounds) {
                    var cityinfo = result.city;
                    var citybounds = result.bounds;

                    city.name = cityinfo.substring(0, cityinfo.length - 1);
                    city.shortCut(city.name);

                    ajaxGetter();

                    document.getElementById('IPLocation').innerHTML = '您当前所在城市：' + city.name;
                    //地图显示当前城市
                    $("#IPLocationCity").text("城市：" + city.name);
                    _map.setBounds(citybounds);
                }
            } else {
                document.getElementById('IPLocation').innerHTML = result.info;
            }
        });
    }


    // 点击获取房源信息
    var Get58DataClick = function() {

        $("#Get58Data").attr("disabled", true);
        $.AMUI.progress.start();

        if ($("input[name='locationType']:checked").val() == '0') {
            city.shortCut();
        }

        var costFrom = $("#costFrom").val();
        var costTo = $("#costTo").val();

        if (costFrom == "" || costTo == "") {
            alert("请输入价格区间...");
            $("#Get58Data").attr("disabled", false);
            $.AMUI.progress.done();
            return;
        }

        if (isNaN(costFrom) || isNaN(costTo)) {
            alert("请输入正确的整数...");
            $("#Get58Data").attr("disabled", false);
            $.AMUI.progress.done();
            return;
        }

        $.ajax({
            type: "post",
            url: getDataAction,
            data: { costFrom: costFrom, costTo: costTo, cnName: city.shortName },
            success: function(result) {
                if (result.IsSuccess) {
                    $.AMUI.progress.start();
                    marker.clearArray();
                    var rent_locations = new Set();
                    result.HouseInfos.forEach(function(item, index) {
                        rent_locations.add(item);
                    });
                    rent_locations.forEach(function(element, index) {
                        marker.add(element.HouseLocation, element.Money, element.HouseURL);
                    });
                    $("#Get58Data").attr("disable", false);

                    $.AMUI.progress.done();
                } else {
                    alert(result.Error);
                }
                $("#Get58Data").attr("disabled", false);
                $.AMUI.progress.done();
            }
        });
    };

    var move2Location = function() {
        _map.on('moveend', getCity);

        function getCity() {
            _map.getCity(function(data) {
                if (data['province'] && typeof data['province'] === 'string') {

                    var cityinfo = (data['city'] || data['province']);
                    city.name = cityinfo.substring(0, cityinfo.length - 1);
                    city.shortCut();
                    $("#IPLocationCity").text("城市：" + city.name);
                    document.getElementById('IPLocation').innerHTML = '地图中心所在城市：' + city.name;
                }
            });
        }
    }

    var locationMethodOnChange = function() {
        if ($("input[name='locationType']:checked").val() == '1') {
            showCityInfo();
        } else {
            move2Location();
        }
    }

    return {
        init: init,
        Get58DataClick: Get58DataClick,
        showCityInfo: showCityInfo,
        marker: marker,
        locationMethodOnChange: locationMethodOnChange,
        workLocation: workLocation
    }
});
