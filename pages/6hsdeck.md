---
layout: page
title: Monitor
permalink: /monitor/
icon: octicon-tools
isNavItem: true
---


<iframe src="https://monitor.ixjx.eu.org/" name="myiframe" width="100%" scrolling="no" frameborder="0">
</iframe>

<!-- <iframe src="https://ixjx.herokuapp.com?code=AAECAaPDAwzCBqIJq5EDiZ0D+qQD36kD6qwDl60Dqq8D068D47QD8b8DCf6VA9qbA52pA+isA+usA/6uA622A8S5A/O7AwA=&name=麻将术" name="myiframe" width="100%" scrolling="no" frameborder="0">
</iframe>

<iframe src="https://ixjx.herokuapp.com?code=AAEBAaPDAw6TBNwGwg/WEeCsAsnCApfTAujnAtvpAvWAA4mdA/2kA/CsA8S5AwiODt7EAufLAovhAtqbA52pA+usA/2wAwA=&name=狂野鸽子术" name="myiframe" width="100%" scrolling="no" frameborder="0">
</iframe> -->

<script>
    function changeFrameHeight(){
        var ifm= document.getElementsByName("myiframe"); 
        for (i=0;i<ifm.length;i++){
            ifm[i].height=document.documentElement.clientHeight-56;
        }
    }
    document.onload=changeFrameHeight();
    window.onresize=function(){changeFrameHeight();}
</script>