---
layout: post
title: Blog
include_in_header: true
---


<div class="article-container">
      {% for post in site.posts %}
      <div class="article">
          <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
          <p>{{ post.excerpt }}</p>
      </div>
      {% endfor %}
  </div>