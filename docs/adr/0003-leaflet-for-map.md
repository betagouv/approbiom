# 1. Record architecture decisions

Date: 2026-08-21

## Status

Accepted

## Context

We need to display points and polygons on a map in Ressource and Concurrence pages.

## Decision

We will use the Javascript Library Leaflet because it's lightweight and intuitive, meaning it's convenient for an iframe in Grist and convenient for developers to implement.

## Consequences

//dont forget to add leaflet css file and javascript file in the head section of the document

It may be not the best library for handling large datasets or highly interactive maps. If it becomes an issue in the future, consider switching to Maplibre.
